# README – Secure Wallet‑to‑Wallet & NFT‑Gated Group Messaging

This document describes the architecture and implementation plan for adding:

- Direct, wallet‑to‑wallet DMs  
- NFT‑gated group chats  

using an off‑chain, end‑to‑end encrypted (E2EE) storage + stateless relay model optimized for speed, efficiency, scalability, and strong privacy.

Target stack (assumed from current project):
- Frontend: Vite + React + Tailwind
- Backend: Node.js/TypeScript (Express/Fastify/Nest or similar)
- Chain: Solana (but design is chain‑agnostic)
- DB: Postgres / Dynamo / Mongo (any K/V or document store works)

You (or your agent) can treat this as the spec to implement.

--------------------------------------------------
1. High‑Level Architecture
--------------------------------------------------

Core principles:

- Wallet = identity (or a derived “messaging key” identity).
- All messages are E2E encrypted client‑side.
- Backend/relay is stateless w.r.t. content; it only routes ciphertext.
- Access control (for groups) is on‑chain (NFT gated).
- Storage is off‑chain for speed/scale; optionally use IPFS for media.

Components:

- Client:
  - Wallet connect + messaging keypair management
  - ECDH key derivation for DMs / group keys
  - Local encryption/decryption
  - UI for DMs, groups, and media
- Backend (Relay API):
  - Auth via wallet signature
  - Store/fetch encrypted messages
  - NFT ownership checks for group membership
- Storage:
  - DB: metadata + ciphertext
  - Optional: IPFS/S3 for media blobs

--------------------------------------------------
2. Identities & Keys
--------------------------------------------------

2.1 Wallet Identity

- Each user logs in using their crypto wallet.
- DO NOT overuse the signing key directly for encryption.  
  Instead, derive a **messaging keypair**.

2.2 Messaging Keypair

- On first login:
  - Generate a new Ed25519 / X25519 keypair in client.
  - Encrypt the private messaging key with a key derived from:
    - Wallet signature (e.g., SIWE‑style) OR
    - OS secure storage (Keychain/Keystore).
  - Persist encrypted messaging private key locally.

- Backend stores:
  - `user_wallet_address`
  - `user_messaging_pubkey` (public only)

This allows you to rotate messaging keys, and not tie long‑term encryption keys directly to the on‑chain signer.

2.3 Conversation Keys

- DMs:
  - For wallet A and wallet B:
    - Derive a shared secret using ECDH: `sharedSecret = ECDH(A_msg_priv, B_msg_pub)` or vice versa.
    - Derive symmetric key: `k_dm = KDF(sharedSecret, "dm:<A>|<B>")`.
- Groups:
  - Each group has a random symmetric key `k_group`.
  - Group key is encrypted individually to each member’s messaging pubkey and stored as “groupKeyEnvelope” for that member.

--------------------------------------------------
3. Direct Messages (DMs) – Flow
--------------------------------------------------

3.1 Data Model (simplified)

Table: `users`
- `wallet_address` (PK)
- `messaging_pubkey`

Table: `conversations`
- `conversation_id` (PK)
- `type` = "dm"
- `participant_a_wallet`
- `participant_b_wallet`
- Optional: `created_at`

Table: `messages`
- `id`
- `conversation_id`
- `sender_wallet`
- `ciphertext` (base64/binary)
- `nonce` (for AES‑GCM / XChaCha20)
- `created_at`
- `message_type` ("text" | "media" | ...)
- `media_pointer` (optional CID/URL if media)

3.2 DM Send Flow (client)

1) Ensure messaging keypair is available (create if first time).
2) Resolve DM conversation:
   - Check if conversation exists between A and B.
   - If not, create `conversation` via backend.
3) Derive DM symmetric key:
   - Fetch peer’s `messaging_pubkey` from backend.
   - `k_dm = KDF(ECDH(my_msg_priv, peer_msg_pub), "dm:<A>|<B>")`.
4) Encrypt message:
   - Generate nonce.
   - `ciphertext = Encrypt(k_dm, nonce, {content, mediaPointer, ...})`.
5) Call backend `POST /messages`:
   - Body: `{ conversationId, ciphertext, nonce, messageType, mediaPointer? }`.
6) Backend:
   - Auth: verify wallet signature or session.
   - Validate `sender` is part of `conversation`.
   - Insert row into `messages` table.
   - Optionally push to WebSocket subscribers for real‑time updates.

3.3 DM Receive Flow (client)

1) Subscribe to new messages via WebSocket or polling (`GET /messages?conversationId=...&since=<cursor>`).
2) For each incoming `ciphertext/nonce`:
   - Derive `k_dm` as above.
   - Decrypt in client.
3) Render decrypted messages in UI.

Server NEVER sees plaintext.

--------------------------------------------------
4. NFT‑Gated Groups – Flow
--------------------------------------------------

4.1 Group Model

Table: `groups`
- `group_id` (PK)
- `owner_wallet`
- `nft_contract_address` (or mint address on Solana)
- `nft_criteria` (JSON; e.g., required token ID, min balance)
- `group_public_metadata` (name, description, avatar URL, etc.)

Table: `group_members`
- `group_id`
- `member_wallet`
- `encrypted_group_key` // group key encrypted with member’s messaging pubkey
- `joined_at`
- Unique(group_id, member_wallet)

Group messages reuse the same `messages` table with `conversation_id` referencing `groups` or you can have a separate `group_messages` table.

4.2 Group Creation Flow

Client:

1) User connects wallet, picks group name + gating NFT.
2) Client generates a random group symmetric key `k_group`.
3) Client calls backend `POST /groups` with:
   - `nft_contract`, `criteria`, public metadata.
   - `owner_wallet` is derived from auth.
4) Backend:
   - Creates `group` row.
5) Client:
   - Encrypts `k_group` with owner’s messaging pubkey and sends `POST /groups/:id/group-key` or as part of creation.
6) Backend:
   - Stores `encrypted_group_key` for owner in `group_members`.

You can also generate `k_group` server‑side and encrypt to owner, but better to generate it client‑side for stricter privacy.

4.3 Join Group Flow (NFT Gating)

Client:

1) User clicks “Join Group.”
2) Backend or client verifies NFT ownership:
   - On backend: use Solana RPC/indexer to check if `wallet_address` meets `nft_criteria`.
3) If NFT gating passes:
   - Backend fetches group’s `k_group` (owner’s view) or some canonical group key.
   - Either:
     - Owner (or a service acting as group admin) encrypts `k_group` to new member’s `messaging_pubkey`, OR
     - A group key distribution mechanism runs (for first version, just let backend do encryption using stored `k_group` **if** you intentionally allow this; second version can use more advanced forward secrecy).
4) Backend writes `group_members` entry:
   - `member_wallet`, `encrypted_group_key`.
5) Client fetches `encrypted_group_key`, decrypts locally using its messaging private key, and caches `k_group`.

4.4 Sending Group Messages

Client:

1) Ensure `k_group` is decrypted in memory.
2) Construct message payload: `{ content, mediaPointer?, timestamp }`.
3) Encrypt with `k_group` + new nonce.
4) Call backend `POST /group-messages`:
   - `{ groupId, ciphertext, nonce, messageType, mediaPointer }`.
5) Backend:
   - Checks user is in `group_members`.
   - Stores message row.
   - Notifies group members via WebSocket/pub‑sub.

Receiving:

- Clients subscribe to `groupId` channel.
- On new messages, use `k_group` to decrypt.

Again, backend never sees plaintext; it only checks group membership + NFT gating.

--------------------------------------------------
5. Media (Images, Files, Voice Notes)
--------------------------------------------------

For maximum privacy + scalability:

- Encrypt media client‑side with per‑message key (or reuse `k_dm` / `k_group` but recommended to derive a sub‑key).
- Upload encrypted blob to a storage layer.
- Store only a pointer (URL/CID) in the message payload.

Options:

A) S3 / GCS / R2
- Easiest operationally.
- Store `ciphertext` files, no server‑side decryption.
- Use signed URLs if you want to control lifetime.

B) IPFS / Arweave
- For public, persistent, censorship‑resistant media.
- Still store ciphertext; only holders of message / group key can decrypt.

Implementation outline:

1) Client:
   - Derive `k_media = KDF(k_dm/k_group, "media:<id>")`.
   - Encrypt file/bytes → `ciphertextMedia`.
   - Upload `ciphertextMedia` to storage.
   - Receive `mediaPointer` (URL/CID).
   - Include `mediaPointer` in encrypted JSON payload of the chat message.

2) On receive:
   - Decrypt main message → get `mediaPointer`.
   - Fetch `ciphertextMedia` from storage.
   - Decrypt with `k_media`.

You DO NOT need to store plaintext media anywhere.

--------------------------------------------------
6. Auth & API Design
--------------------------------------------------

6.1 Auth (Wallet‑Based)

Basic pattern:

- Client gets a nonce from `/auth/nonce`.
- User signs `nonce` with wallet.
- Client sends signature + wallet address to `/auth/login`.
- Backend verifies signature and issues a short‑lived JWT/session.

Backend then can trust `req.user.wallet` for all subsequent operations (e.g., sending messages, creating groups).

6.2 Example API Endpoints (REST-ish)

- `GET /auth/nonce`
- `POST /auth/login` – returns JWT
- `GET /me` – returns user + messaging pubkey
- `POST /users/messaging-key` – register or update messaging public key

DM:
- `POST /conversations` – create DM conversation
- `GET /conversations` – list user’s conversations
- `POST /messages` – send DM
- `GET /messages?conversationId=...&cursor=...` – fetch DM history

Groups:
- `POST /groups` – create group + NFT gating config
- `GET /groups` – list visible groups (filter by NFT gating if needed)
- `POST /groups/:groupId/join` – join group (backend checks NFT)
- `GET /groups/:groupId/members`
- `POST /group-messages` – send group message
- `GET /group-messages?groupId=...&cursor=...` – fetch group history
- `GET /groups/:groupId/group-key` – fetch encrypted group key envelope for current wallet

Media:
- `POST /media/upload` – optionally get signed URL or direct upload token
- Or direct upload to IPFS via a pinning provider

WebSockets:
- `/ws` – subscribe to DM and group channels; events like `message:new`, `groupMessage:new`.

--------------------------------------------------
7. Privacy, Security, and Key Management
--------------------------------------------------

- E2EE is **mandatory**:
  - All messages must be encrypted client‑side.
- Metadata minimization:
  - Store minimal metadata: `sender_wallet`, `groupId/conversationId`, `timestamp`.
  - Optionally, implement TTL for messages and media to auto‑delete.
- Local storage:
  - Store decrypted messages in an encrypted local DB (SQLCipher, IndexedDB + crypto, or device keychain/secure storage).
- Key rotation:
  - For DMs, you can re‑derive `k_dm` each session.
  - For groups, rotate `k_group` when:
    - A member leaves,
    - Owner kicks someone,
    - Or at periodic intervals.
- Backups:
  - Allow optional backup of encrypted messaging keys and conversations to user’s cloud (encrypted with a passphrase only they know).

--------------------------------------------------
8. Prerequisites & API Keys
--------------------------------------------------

Mandatory:

- Wallet integration:
  - Solana wallet adapter / EVM provider, depending on chain.
- RPC / Indexer:
  - You need a stable RPC or indexer to:
    - Verify NFTs for group gating.
    - Optionally look up ENS / human‑readable names.
  - Examples:
    - Helius / QuickNode / Alchemy / Ankr etc. (Solana or EVM endpoints)
- Storage:
  - DB: Postgres / MySQL / Mongo / DynamoDB.
  - Media storage:
    - S3/GCS/R2 credentials OR
    - IPFS pinning provider (e.g., Pinata, Web3.Storage) API key.

Optional but recommended:

- IPFS pinning service API key (if using IPFS).
- Logging/monitoring for backend.

No external messaging protocol API key is strictly required if you implement your own relay. If you integrate a protocol like XMTP/Push, you will follow their onboarding, but this README assumes **your own relay**.

--------------------------------------------------
9. Implementation Order (For Your Agent)
--------------------------------------------------

1) Implement wallet login + messaging keypair generation and registration.
2) Build DM flow:
   - Conversation CRUD
   - ECDH → `k_dm`
   - Encrypt/decrypt + message send/receive.
3) Add basic WebSocket layer for real‑time updates.
4) Implement NFT‑gated groups:
   - Group model
   - NFT ownership check via RPC
   - Group key generation, per‑member encrypted envelopes
   - Group message encryption/decryption.
5) Add media support:
   - Encrypted upload, pointer in messages.
6) Harden:
   - Local encrypted storage
   - Key rotation rules
   - Metadata minimization, TTL.

This gives you a **fast, scalable, and strongly private** wallet‑to‑wallet and NFT‑gated group messaging system that matches your design goals.