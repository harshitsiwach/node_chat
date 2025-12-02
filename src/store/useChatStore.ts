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

interface ChatState {
    currentUser: User | null;
    activeChat: string | null;
    mobileView: 'list' | 'chat';
    isOfflineMode: boolean;
    chats: Chat[];
    messages: Record<string, Message[]>; // chatId -> messages
    peers: MeshPeer[];

    setCurrentUser: (user: User | null) => void;
    updateUserName: (name: string) => void;
    setActiveChat: (chatId: string) => void;
    setMobileView: (view: 'list' | 'chat') => void;
    setOfflineMode: (isOffline: boolean) => void;
    addPeer: (peer: MeshPeer) => void;
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
    chats: [
        {
            id: '1',
            name: '0x1234...5678',
            type: 'direct',
            participants: ['0x1234...5678'],
            unreadCount: 2,
            status: 'online',
            lastMessage: 'Coordinates received.',
            lastMessageTime: '10:42'
        },
    ],
    messages: {
        'mission_control': [
            { id: '1', text: 'System initialized.', isSent: false, timestamp: '10:00:00', sender: 'SYSTEM', status: 'read', type: 'text' },
            { id: '2', text: 'Secure connection established.', isSent: false, timestamp: '10:00:01', sender: 'SYSTEM', status: 'read', type: 'text' },
        ]
    },
    peers: [],

    setCurrentUser: (user) => set({ currentUser: user }),
    updateUserName: (name) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, name } : null
    })),
    setActiveChat: (chatId) => set({ activeChat: chatId, mobileView: 'chat' }),
    setMobileView: (view) => set({ mobileView: view }),
    setOfflineMode: (isOffline) => set({ isOfflineMode: isOffline }),
    addPeer: (peer) => set((state) => {
        const exists = state.peers.some(p => p.id === peer.id);
        if (exists) return state;
        return { peers: [...state.peers, peer] };
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
