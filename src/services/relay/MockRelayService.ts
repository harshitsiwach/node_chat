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
    maxSupply?: number;
    currentSupply?: number;
    mintPrice?: string; // e.g. "0.01 ETH"
    fees?: {
        message: number;
        media: number;
        link: number;
        recipientAddress: string;
    };
    // In real app, we'd store encrypted key PER MEMBER.
    // For mock, we'll just store the key and "pretend" we re-encrypt it for each member fetch.
}

class MockRelayService {
    private users: Map<string, RelayUser> = new Map(); // wallet -> User
    private messages: Map<string, RelayMessage[]> = new Map(); // conversationId -> Messages
    private groups: Map<string, GroupMetadata> = new Map(); // groupId -> Group Metadata
    private channel: BroadcastChannel;
    private readonly GLOBAL_CHANNEL_ID = 'global_public_channel';
    private messageListeners: ((msg: RelayMessage) => void)[] = [];

    constructor() {
        this.channel = new BroadcastChannel('mock_relay_channel');
        this.channel.onmessage = (event) => this.handleBroadcastMessage(event.data);

        // Initialize Global Channel
        this.initializeGlobalChannel();
    }

    onMessage(callback: (msg: RelayMessage) => void) {
        this.messageListeners.push(callback);
        return () => {
            this.messageListeners = this.messageListeners.filter(l => l !== callback);
        };
    }

    private initializeGlobalChannel() {
        if (!this.groups.has(this.GLOBAL_CHANNEL_ID)) {
            const globalGroup: GroupMetadata = {
                id: this.GLOBAL_CHANNEL_ID,
                name: 'Global Public Chat',
                nftContract: '', // No contract
                ownerWallet: 'system',
                members: [], // Will auto-add users
                groupKey: 'public_key', // Public key for everyone
                maxSupply: 0, // Infinite
                currentSupply: 0
            };
            this.groups.set(this.GLOBAL_CHANNEL_ID, globalGroup);
            console.log('[Relay] Global Channel Initialized');
        }
    }

    private handleBroadcastMessage(data: any) {
        console.log('[Relay] Received broadcast:', data.type);
        switch (data.type) {
            case 'REGISTER_USER':
                this.users.set(data.payload.walletAddress, data.payload);
                // Auto-add to global channel locally if not present
                this.addToGlobalChannel(data.payload.walletAddress);
                break;
            case 'SEND_MESSAGE':
                const { message } = data.payload;
                const msgs = this.messages.get(message.conversationId) || [];
                // Avoid duplicates
                if (!msgs.find(m => m.id === message.id)) {
                    msgs.push(message);
                    this.messages.set(message.conversationId, msgs);

                    // Notify listeners (UI)
                    this.messageListeners.forEach(listener => listener(message));
                }
                break;
            case 'CREATE_GROUP':
                this.groups.set(data.payload.id, data.payload);
                break;
            case 'JOIN_GROUP':
                const { groupId, walletAddress } = data.payload;
                const group = this.groups.get(groupId);
                if (group && !group.members.includes(walletAddress)) {
                    group.members.push(walletAddress);
                    this.groups.set(groupId, group);
                }
                break;
            case 'UPDATE_GROUP':
                this.groups.set(data.payload.id, data.payload);
                break;
            case 'DEPLOY_CONTRACT':
                // No state to sync for deployment itself, but maybe useful for logs
                break;
            case 'MINT_MEMBERSHIP':
                const { contractAddress, walletAddress: minter } = data.payload;
                this.recordMint(contractAddress, minter);
                // Also update group supply if it exists
                const groupToUpdate = Array.from(this.groups.values()).find(g => g.nftContract === contractAddress);
                if (groupToUpdate) {
                    groupToUpdate.currentSupply = (groupToUpdate.currentSupply || 0) + 1;
                    this.groups.set(groupToUpdate.id, groupToUpdate);
                }
                break;
        }
    }

    // Register a user's messaging public key
    async registerUser(walletAddress: string, publicKey: string) {
        this.users.set(walletAddress, { walletAddress, publicKey });

        // Auto-join Global Channel
        this.addToGlobalChannel(walletAddress);

        this.channel.postMessage({
            type: 'REGISTER_USER',
            payload: { walletAddress, publicKey }
        });
        console.log(`[Relay] Registered user ${walletAddress}`);
    }

    private addToGlobalChannel(walletAddress: string) {
        const globalGroup = this.groups.get(this.GLOBAL_CHANNEL_ID);
        if (globalGroup && !globalGroup.members.includes(walletAddress)) {
            globalGroup.members.push(walletAddress);
            this.groups.set(this.GLOBAL_CHANNEL_ID, globalGroup);
        }
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

        this.channel.postMessage({
            type: 'SEND_MESSAGE',
            payload: { message }
        });
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
    async createGroup(name: string, ownerWallet: string, nftContract: string, tokenId?: string, maxSupply?: number): Promise<string> {
        const groupId = `group_${Date.now()}`;
        // Generate a random group key (simulated)
        const groupKey = window.crypto.randomUUID();

        const newGroup: GroupMetadata = {
            id: groupId,
            name,
            nftContract,
            tokenId,
            ownerWallet,
            members: [ownerWallet],
            groupKey,
            maxSupply,
            currentSupply: 1 // Owner is first member/minter
        };

        this.groups.set(groupId, newGroup);
        this.channel.postMessage({
            type: 'CREATE_GROUP',
            payload: newGroup
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

        // Bypass NFT check for Global Channel
        if (groupId === this.GLOBAL_CHANNEL_ID) {
            group.members.push(walletAddress);
            this.groups.set(groupId, group);
            this.channel.postMessage({
                type: 'JOIN_GROUP',
                payload: { groupId, walletAddress }
            });
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

        this.channel.postMessage({
            type: 'JOIN_GROUP',
            payload: { groupId, walletAddress }
        });

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
            // TODO: Broadcast pin event if needed
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

    async updateGroupSettings(groupId: string, fees: GroupMetadata['fees']): Promise<boolean> {
        const group = this.groups.get(groupId);
        if (!group) return false;

        group.fees = fees;
        this.groups.set(groupId, group);

        this.channel.postMessage({
            type: 'UPDATE_GROUP',
            payload: group
        });

        console.log(`[Relay] Updated settings for group ${groupId}`, fees);
        return true;
    }

    // --- NFT Factory Simulation ---

    // Simulate deploying a new NFT contract
    async deployGroupContract(name: string, symbol: string, maxSupply: number): Promise<string> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const contractAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        console.log(`[Relay] Deployed contract ${name} (${symbol}) at ${contractAddress} with supply ${maxSupply}`);

        this.channel.postMessage({
            type: 'DEPLOY_CONTRACT',
            payload: { name, symbol, contractAddress, maxSupply }
        });

        return contractAddress;
    }

    // Simulate minting a membership NFT
    async mintMembership(contractAddress: string, walletAddress: string): Promise<boolean> {
        // Find group associated with this contract
        const group = Array.from(this.groups.values()).find(g => g.nftContract === contractAddress);

        if (!group) {
            // If no group yet (just deployed), we might just track mints separately or assume success for now
            // For the "Create Group" flow, the group is created AFTER deployment, so this might be called before group creation?
            // Actually, the flow is: Deploy -> Show Address -> Create Group (on Relay) -> Mint.
            // Or: Deploy -> Mint -> Create Group.

            // Let's store "minted" state in a simple map for now to support the "checkOwnership" fallback
            this.recordMint(contractAddress, walletAddress);
            this.channel.postMessage({
                type: 'MINT_MEMBERSHIP',
                payload: { contractAddress, walletAddress }
            });
            return true;
        }

        if (group.maxSupply && (group.currentSupply || 0) >= group.maxSupply) {
            throw new Error("Max supply reached");
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        group.currentSupply = (group.currentSupply || 0) + 1;
        this.groups.set(group.id, group);
        this.recordMint(contractAddress, walletAddress);

        this.channel.postMessage({
            type: 'MINT_MEMBERSHIP',
            payload: { contractAddress, walletAddress }
        });

        console.log(`[Relay] Minted membership for ${walletAddress} on ${contractAddress}`);
        return true;
    }

    // Helper to track mints for NFTService fallback
    private mintedTokens: Map<string, Set<string>> = new Map(); // contract -> Set(wallets)

    private recordMint(contract: string, wallet: string) {
        if (!this.mintedTokens.has(contract)) {
            this.mintedTokens.set(contract, new Set());
        }
        this.mintedTokens.get(contract)?.add(wallet);
    }

    hasMinted(contract: string, wallet: string): boolean {
        return this.mintedTokens.get(contract)?.has(wallet) || false;
    }
}

export const mockRelayService = new MockRelayService();
