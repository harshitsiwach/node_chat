import { nftService } from '../blockchain/NFTService';

// Types for the Relay Service
export interface RelayUser {
    walletAddress: string;
    publicKey: string; // Base64 exported public key
}

export interface RelayMessage {
    id: string;
    conversationId: string;
    senderWallet: string;
    ciphertext: string;
    iv: string; // Initialization Vector for AES-GCM
    timestamp: string;
}

export interface GroupMetadata {
    id: string;
    name: string;
    nftContract: string;
    tokenId?: string; // Optional for ERC-1155
    ownerWallet: string;
    members: string[]; // Wallet addresses
    groupKey: string; // Encrypted Group Key (Simulated as single key for simplicity in mock)
    pinnedMessageIds?: string[];
    // In real app, we'd store encrypted key PER MEMBER.
    // For mock, we'll just store the key and "pretend" we re-encrypt it for each member fetch.
}

class MockRelayService {
    private users: Map<string, RelayUser> = new Map(); // wallet -> User
    private messages: Map<string, RelayMessage[]> = new Map(); // conversationId -> Messages
    private groups: Map<string, GroupMetadata> = new Map(); // groupId -> Group Metadata

    // Register a user's messaging public key
    async registerUser(walletAddress: string, publicKey: string) {
        this.users.set(walletAddress, { walletAddress, publicKey });
        console.log(`[Relay] Registered user ${walletAddress}`);
    }

    // Get a user's public key
    async getUserPublicKey(walletAddress: string): Promise<string | null> {
        const user = this.users.get(walletAddress);
        return user ? user.publicKey : null;
    }

    // Send a message to the relay
    async sendMessage(message: RelayMessage) {
        const msgs = this.messages.get(message.conversationId) || [];
        msgs.push(message);
        this.messages.set(message.conversationId, msgs);
        console.log(`[Relay] Message stored for ${message.conversationId}`);

        // In a real app, this would trigger a WebSocket event
        // For now, we'll rely on polling or local state updates in the UI
    }

    // Fetch messages for a conversation
    async getMessages(conversationId: string): Promise<RelayMessage[]> {
        return this.messages.get(conversationId) || [];
    }

    // Create a DM conversation ID (deterministic based on wallets)
    getDMConversationId(walletA: string, walletB: string): string {
        const sorted = [walletA, walletB].sort();
        return `dm_${sorted[0]}_${sorted[1]}`;
    }

    // Create a Group
    async createGroup(name: string, ownerWallet: string, nftContract: string, tokenId?: string): Promise<string> {
        const groupId = `group_${Date.now()}`;
        // Generate a random group key (simulated)
        const groupKey = window.crypto.randomUUID();

        this.groups.set(groupId, {
            id: groupId,
            name,
            nftContract,
            tokenId,
            ownerWallet,
            members: [ownerWallet],
            groupKey
        });
        console.log(`[Relay] Group created: ${name} (${groupId})`);
        return groupId;
    }

    // Join a Group (NFT Gated)
    async joinGroup(groupId: string, walletAddress: string): Promise<{ success: boolean; groupKey?: string; error?: string }> {
        const group = this.groups.get(groupId);
        if (!group) return { success: false, error: "Group not found" };

        if (group.members.includes(walletAddress)) {
            return { success: true, groupKey: group.groupKey };
        }

        // Verify NFT Ownership
        const hasNFT = await nftService.checkOwnership(walletAddress, group.nftContract, group.tokenId);
        if (!hasNFT) {
            return { success: false, error: "NFT ownership verification failed" };
        }

        // Add to members
        group.members.push(walletAddress);
        this.groups.set(groupId, group);
        console.log(`[Relay] User ${walletAddress} joined group ${groupId}`);

        return { success: true, groupKey: group.groupKey };
    }

    // Get all groups
    async getGroups(): Promise<GroupMetadata[]> {
        return Array.from(this.groups.values());
    }

    // Pin a message
    async pinMessage(groupId: string, messageId: string): Promise<boolean> {
        const group = this.groups.get(groupId);
        if (!group) return false;

        if (!group.pinnedMessageIds) group.pinnedMessageIds = [];

        if (!group.pinnedMessageIds.includes(messageId)) {
            group.pinnedMessageIds.push(messageId);
            this.groups.set(groupId, group);
            console.log(`[Relay] Pinned message ${messageId} in group ${groupId}`);
        }
        return true;
    }

    async unpinMessage(groupId: string, messageId: string): Promise<boolean> {
        const group = this.groups.get(groupId);
        if (!group || !group.pinnedMessageIds) return false;

        group.pinnedMessageIds = group.pinnedMessageIds.filter(id => id !== messageId);
        this.groups.set(groupId, group);
        return true;
    }
}

export const mockRelayService = new MockRelayService();
