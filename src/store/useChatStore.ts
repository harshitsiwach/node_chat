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
}

import type { MeshPeer } from '../services/mesh/types';
import type { WifiPeer } from '../services/wifi/types';

interface ChatState {
    currentUser: User | null;
    activeChat: string | null;
    mobileView: 'list' | 'chat';
    isOfflineMode: boolean;
    isWifiMode: boolean;
    chats: Chat[];
    messages: Record<string, Message[]>; // chatId -> messages
    peers: MeshPeer[];
    wifiPeers: WifiPeer[];

    setCurrentUser: (user: User | null) => void;
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
    createGroupChat: (name: string, addresses: string[]) => void;
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

    setCurrentUser: (user) => set({ currentUser: user }),
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
    createGroupChat: (name, addresses) => {
        const id = `group_${Date.now()}`;
        const newChat: Chat = {
            id,
            name,
            type: 'group',
            participants: addresses,
            unreadCount: 0,
            status: 'online',
        };
        set(state => ({
            chats: [...state.chats, newChat],
            messages: { ...state.messages, [id]: [] },
            activeChat: id
        }));
    }
}));
