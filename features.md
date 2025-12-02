# Cypher Text - Features & Implementation Guide

This document serves as a comprehensive guide for the "Cypher Text" application. It details existing features, their technical implementation, and instructions for future development.

## 1. Technology Stack

-   **Framework**: Next.js 16 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS 4, Framer Motion, Shadcn UI (Radix Primitives)
-   **State Management**: Zustand (`src/hooks/useChatStore.ts`)
-   **Web3/Crypto**: Wagmi, Viem
-   **Mobile Runtime**: Capacitor (iOS/Android)
-   **Theme**: `next-themes` (Light/Dark mode)

---

## 2. UI/UX Architecture

### 2.1. Telegram-Inspired Aesthetic
**Description**: A clean, high-visibility interface mimicking Telegram Web. It features a two-column layout on desktop and a fluid, single-column navigation on mobile.
**Implementation**:
-   **Layout**: `src/app/page.tsx` uses a flex container.
    -   **Desktop**: Sidebar (`ChatList`) is fixed width (`w-[350px]`), Chat Area (`ChatInterface`) takes remaining space (`flex-1`).
    -   **Mobile**: Sidebar should be the default view, navigating to Chat Interface on selection (currently handled via CSS visibility classes, needs robust routing/state).
-   **Styling**: `src/app/globals.css` defines CSS variables for `primary`, `secondary`, `msg-sent`, `msg-received` to match Telegram's palette.
    -   *Light Mode*: White background, Blue accents (`#3390ec`).
    -   *Dark Mode*: Dark Gray background (`#212121`), Purple/Blue accents.

### 2.2. Theme System
**Description**: Robust light and dark mode switching.
**Implementation**:
-   **Provider**: `src/components/ThemeProvider.tsx` wraps the app with `next-themes`.
-   **Toggle**: `src/components/ThemeToggle.tsx` provides a UI to switch modes.
-   **Variables**: All colors are defined as CSS variables in `globals.css` and referenced in `tailwind.config.ts`. **Instruction**: Always use semantic color names (e.g., `bg-background`, `text-primary`) instead of hardcoded hex values.

### 2.3. Animations
**Description**: Fluid, physics-based animations for interactions.
**Implementation**:
-   **Library**: `framer-motion`.
-   **Components**:
    -   `FluidButton`: Adds a liquid/organic feel to button presses.
    -   `WelcomeScreen`: Cinematic entrance animation.
    -   `ChatInterface`: Message bubbles animate in (`initial={{ opacity: 0, y: 10 }}`).

---

## 3. Core Features (Implemented & Mocked)

### 3.1. Chat Interface
**Description**: The main messaging view.
**Current Implementation**: `src/components/ChatInterface.tsx`
-   **Header**: Displays chat title, status, and action icons.
-   **Message List**: Renders a list of messages.
    -   *Sent Messages*: Aligned right, colored background (`bg-msg-sent`).
    -   *Received Messages*: Aligned left, neutral background (`bg-msg-received`).
-   **Input Area**: Auto-expanding textarea with send button.
**Future Implementation**:
-   Connect `onSend` to the Mesh Network layer.
-   Implement virtual scrolling for large message histories.

### 3.2. Chat List (Sidebar)
**Description**: List of active conversations.
**Current Implementation**: `src/components/ChatList.tsx`
-   **Structure**: Header (User profile), Search bar, Scrollable list of chats.
-   **Items**: Show Avatar, Name, Last Message preview, Timestamp, Unread badge.
**Future Implementation**:
-   Sort by last active timestamp.
-   Real-time updates from the local database.

### 3.3. Wallet Connection
**Description**: Web3 wallet integration for identity and payments.
**Current Implementation**: `src/components/WalletConnect.tsx`
-   Uses `wagmi` hooks (`useAccount`, `useConnect`, `useDisconnect`).
-   Wrapped in `src/app/providers.tsx`.

---

## 4. Planned Features (Instructions for Implementation)

### 4.1. Mesh Network Layer
**Goal**: Enable offline messaging via Bluetooth LE and WiFi Direct.
**Instructions**:
1.  **Capacitor Plugin**: Use `@capacitor-community/bluetooth-le` or similar for mobile mesh.
2.  **Logic**: Create a `MeshService` (singleton) that:
    -   Scans for nearby peers.
    -   Maintains a routing table (who is connected to whom).
    -   Floods messages with a TTL (Time To Live) to reach distant nodes.
3.  **Integration**: Hook into `useChatStore` to append received messages.

### 4.2. End-to-End Encryption (E2EE)
**Goal**: Secure all messages using the Noise Protocol or Signal Protocol.
**Instructions**:
1.  **Library**: Use `libsodium.js` or a pure JS implementation of Noise.
2.  **Key Management**: Generate a key pair on first launch. Store private key securely (e.g., Capacitor Secure Storage).
3.  **Handshake**: Implement an X3DH (Extended Triple Diffie-Hellman) handshake when starting a new chat.
4.  **Payload**: Encrypt message content before passing it to the `MeshService`.

### 4.3. Local-First Data Storage
**Goal**: Persist messages on the device.
**Instructions**:
1.  **Database**: Use `sqlite` (via Capacitor plugin) for mobile and `IndexedDB` (via `idb` or `dexie`) for web.
2.  **Schema**:
    -   `contacts`: id, public_key, name, avatar.
    -   `messages`: id, chat_id, sender_id, content (encrypted), timestamp, status (sent/delivered/read).
3.  **Sync**: On app load, hydrate `useChatStore` from the database.

### 4.4. Audio Messages
**Goal**: Record and send voice notes.
**Instructions**:
1.  **Hook**: `src/hooks/useAudioRecorder.ts` is a starting point.
2.  **UI**: Add a microphone icon to `ChatInterface`. Press-and-hold to record.
3.  **Format**: Encode as Opus/Ogg for efficiency.
4.  **Transport**: Chunk large audio files if sending over Mesh (Bluetooth has low bandwidth).

### 4.5. Location Channels
**Goal**: Geofenced public chat rooms.
**Instructions**:
1.  **Component**: `src/components/LocationChannels.tsx`.
2.  **Logic**:
    -   Get GPS coordinates.
    -   Derive a "Channel ID" from the H3 index or Geohash (precision determines range).
    -   Subscribe to this ID on the Mesh network.

---

## 5. Development Guidelines

-   **Components**: Keep components small and focused. Use `src/components/ui` for generic primitives.
-   **State**: Use `useChatStore` for global app state (user profile, active chat, peers). Use local state for UI interactions (input value, menu open).
-   **Styling**: Stick to the defined CSS variables. Do not introduce new colors without adding them to `globals.css` first.
-   **Mobile First**: Always test layout on mobile viewports. Ensure touch targets are at least 44px.
