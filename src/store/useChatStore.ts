import { create } from 'zustand';

export interface Message {
    id: string;
    text: string;
    isSent: boolean;
    timestamp: string;
    sender: string;
    status?: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'audio';
    mediaUrl?: string;
    isMesh?: boolean;
    // QoL Features
    reactions?: Record<string, string[]>; // emoji -> wallet addresses
    replyTo?: string; // ID of the message being replied to
    isPinned?: boolean;
    poll?: PollData;
}

export interface PollOption {
    id: number;
    text: string;
    votes: number;
    voters: string[]; // wallet addresses
}

export interface PollData {
    id: string;
    question: string;
    options: PollOption[];
    createdAt: number;
    endsAt: number;
}

export interface Peer {
    id: string;
    name: string;
    address: string;
    status: 'online' | 'offline' | 'idle';
    lastSeen: number;
}

export interface User {
    id: string;
    name: string;
    address: string;
}

export interface Chat {
    id: string;
    name: string;
    type: 'direct' | 'group';
    participants: string[];
    unreadCount: number;
    status: 'online' | 'offline' | 'idle';
    lastMessage?: string;
    lastMessageTime?: string;
    metadata?: {
        nftContract?: string;
        tokenId?: string;
        ownerWallet?: string;
        groupKey?: string; // Encrypted or Decrypted key
    };
}

import type { MeshPeer } from '../services/mesh/types';
import type { WifiPeer } from '../services/wifi/types';

interface ChatState {
    currentUser: User | null;
    messagingKeyPair: CryptoKeyPair | null; // Added
    activeChat: string | null;
    mobileView: 'list' | 'chat';
    isOfflineMode: boolean;
    isWifiMode: boolean;
    chats: Chat[];
    messages: Record<string, Message[]>; // chatId -> messages
    peers: MeshPeer[];
    wifiPeers: WifiPeer[];

    setCurrentUser: (user: User | null) => void;
    setMessagingKeyPair: (keyPair: CryptoKeyPair | null) => void; // Added
    updateUserName: (name: string) => void;
    setActiveChat: (chatId: string) => void;
    setMobileView: (view: 'list' | 'chat') => void;
    setOfflineMode: (isOffline: boolean) => void;
    setWifiMode: (isWifi: boolean) => void;
    addPeer: (peer: MeshPeer) => void;
    addWifiPeer: (peer: WifiPeer) => void;
    addMessage: (chatId: string, message: Message) => void;
    setMessages: (chatId: string, messages: Message[]) => void;
    updatePeerStatus: (peerId: string, status: Peer['status']) => void;
    createDirectChat: (participant: string) => void;
    createGroupChat: (name: string, addresses: string[], metadata?: Chat['metadata']) => void;
    // QoL Actions
    addReaction: (chatId: string, messageId: string, emoji: string, walletAddress: string) => void;
    pinMessage: (chatId: string, messageId: string, isPinned: boolean) => void;
    votePoll: (chatId: string, messageId: string, optionId: number, walletAddress: string) => void;
    joinGlobalChannel: () => void;

    // Presence
    onlineUsers: string[];
    setOnlineUsers: (users: string[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    currentUser: null,
    activeChat: null,
    mobileView: 'list',
    isOfflineMode: false,
    isWifiMode: false,
    chats: [
        {
            id: '1',
            name: 'General',
            type: 'group',
            participants: [],
            unreadCount: 0,
            lastMessage: 'Welcome to NODE Chat',
            lastMessageTime: '12:00',
            status: 'online'
        }
    ],
    messages: {
        '1': [
            {
                id: '1',
                text: 'Welcome to NODE Chat. Messages are encrypted and stored locally.',
                isSent: false,
                timestamp: '12:00',
                sender: 'System',
                type: 'text'
            }
        ]
    },
    peers: [],
    wifiPeers: [],
    messagingKeyPair: null, // Initial state

    setCurrentUser: (user) => set({ currentUser: user }),
    setMessagingKeyPair: (keyPair) => set({ messagingKeyPair: keyPair }), // Action
    updateUserName: (name) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, name } : null
    })),
    setActiveChat: (chatId) => set({ activeChat: chatId, mobileView: 'chat' }),
    setMobileView: (view) => set({ mobileView: view }),
    setOfflineMode: (isOffline) => set({ isOfflineMode: isOffline }),
    setWifiMode: (isWifi) => set({ isWifiMode: isWifi }),

    addPeer: (peer) => set((state) => {
        const exists = state.peers.some(p => p.id === peer.id);
        if (exists) return state;
        return { peers: [...state.peers, peer] };
    }),

    addWifiPeer: (peer) => set((state) => {
        const exists = state.wifiPeers.some(p => p.id === peer.id);
        if (exists) return state;
        return { wifiPeers: [...state.wifiPeers, peer] };
    }),

    addMessage: (chatId, message) => set((state) => ({
        messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message]
        }
    })),

    setMessages: (chatId, messages) => set((state) => ({
        messages: {
            ...state.messages,
            [chatId]: messages
        }
    })),

    updatePeerStatus: (peerId, status) => set((state) => ({
        peers: state.peers.map(p => p.id === peerId ? { ...p, status } : p)
    })),
    createDirectChat: (address) => {
        const existingChat = get().chats.find(c => c.type === 'direct' && c.participants.includes(address));
        if (existingChat) {
            set({ activeChat: existingChat.id });
            return;
        }
        const newChat: Chat = {
            id: address,
            name: `${address.slice(0, 6)}...${address.slice(-4)}`,
            type: 'direct',
            participants: [address],
            unreadCount: 0,
            status: 'offline',
        };
        set(state => ({
            chats: [...state.chats, newChat],
            messages: { ...state.messages, [newChat.id]: [] },
            activeChat: newChat.id
        }));
    },
    createGroupChat: (name, addresses, metadata) => {
        const id = `group_${Date.now()}`;
        const newChat: Chat = {
            id,
            name,
            type: 'group',
            participants: addresses,
            unreadCount: 0,
            status: 'online',
            metadata
        };
        set(state => ({
            chats: [...state.chats, newChat],
            messages: { ...state.messages, [id]: [] },
            activeChat: id
        }));

    },
    addReaction: (chatId, messageId, emoji, walletAddress) => set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map(msg => {
            if (msg.id === messageId) {
                const currentReactions = msg.reactions || {};
                const currentReactors = currentReactions[emoji] || [];

                // Toggle reaction
                let newReactors;
                if (currentReactors.includes(walletAddress)) {
                    newReactors = currentReactors.filter(w => w !== walletAddress);
                } else {
                    newReactors = [...currentReactors, walletAddress];
                }

                return {
                    ...msg,
                    reactions: {
                        ...currentReactions,
                        [emoji]: newReactors
                    }
                };
            }
            return msg;
        });
        return {
            messages: {
                ...state.messages,
                [chatId]: updatedMessages
            }
        };
    }),
    pinMessage: (chatId, messageId, isPinned) => set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map(msg =>
            msg.id === messageId ? { ...msg, isPinned } : msg
        );
        return {
            messages: {
                ...state.messages,
                [chatId]: updatedMessages
            }
        };
    }),
    votePoll: (chatId, messageId, optionId, walletAddress) => set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map(msg => {
            if (msg.id === messageId && msg.poll) {
                // Remove previous vote if any (single vote per poll for simplicity)
                const newOptions = msg.poll.options.map(opt => {
                    const hasVoted = opt.voters.includes(walletAddress);
                    if (opt.id === optionId) {
                        // Toggle vote
                        return hasVoted
                            ? { ...opt, votes: opt.votes - 1, voters: opt.voters.filter(v => v !== walletAddress) }
                            : { ...opt, votes: opt.votes + 1, voters: [...opt.voters, walletAddress] };
                    } else {
                        // Remove vote from other options if we want single-choice
                        // For now, let's allow multi-choice or just handle the target option
                        // Let's enforce single choice for this implementation
                        if (hasVoted) {
                            return { ...opt, votes: opt.votes - 1, voters: opt.voters.filter(v => v !== walletAddress) };
                        }
                        return opt;
                    }
                });

                return {
                    ...msg,
                    poll: {
                        ...msg.poll,
                        options: newOptions
                    }
                };
            }
            return msg;
        });
        return {
            messages: {
                ...state.messages,
                [chatId]: updatedMessages
            }
        };
    }),
    joinGlobalChannel: () => {
        const GLOBAL_ID = 'global_public_channel';
        const exists = get().chats.find(c => c.id === GLOBAL_ID);
        if (exists) return;

        const globalChat: Chat = {
            id: GLOBAL_ID,
            name: 'Global Public Chat',
            type: 'group',
            participants: [],
            unreadCount: 0,
            status: 'online',
            metadata: {
                ownerWallet: 'system',
                groupKey: 'public_key'
            }
        };
        set(state => ({
            chats: [globalChat, ...state.chats],
            messages: { ...state.messages, [GLOBAL_ID]: [] }
        }));
    },

    onlineUsers: [],
    setOnlineUsers: (users) => set({ onlineUsers: users })
}));
