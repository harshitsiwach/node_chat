import { create } from 'zustand';

export interface MarketplaceListing {
    id: string;
    groupId: string;
    name: string;
    description: string;
    price: string; // ETH
    imageUrl: string;
    owner: string;
    members: number;
}

interface MarketplaceState {
    listings: MarketplaceListing[];
    addListing: (listing: MarketplaceListing) => void;
    removeListing: (id: string) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
    listings: [
        {
            id: '1',
            groupId: 'group_alpha',
            name: 'Alpha Calls 🚀',
            description: 'Exclusive trading signals and alpha. High risk, high reward.',
            price: '0.05',
            imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=600&q=80',
            owner: '0x123...456',
            members: 128
        },
        {
            id: '2',
            groupId: 'group_vip',
            name: 'VIP Lounge 🍸',
            description: 'Chill vibes, networking, and exclusive events.',
            price: '0.1',
            imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=600&q=80',
            owner: '0x789...012',
            members: 42
        },
        {
            id: '3',
            groupId: 'group_devs',
            name: 'Devs Only 💻',
            description: 'Solidity, Rust, and ZK proofs discussion.',
            price: '0.02',
            imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
            owner: '0xabc...def',
            members: 314
        }
    ],
    addListing: (listing) => set((state) => ({ listings: [...state.listings, listing] })),
    removeListing: (id) => set((state) => ({ listings: state.listings.filter(l => l.id !== id) }))
}));
