import { create } from 'zustand';

export interface Game {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    url: string; // URL to the WebGL build
    category: 'casino' | 'arcade' | 'multiplayer';
    players: number;
}

interface GameState {
    games: Game[];
    activeGame: Game | null;
    isGameModalOpen: boolean;
    setActiveGame: (game: Game | null) => void;
    setGameModalOpen: (isOpen: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
    games: [
        {
            id: 'btfd',
            title: 'Buy The Dip',
            description: 'High-stakes crypto trading simulator. Time the market to win big.',
            thumbnailUrl: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=600&q=80',
            url: 'https://btfd-webgl.vercel.app/',
            category: 'casino',
            players: 1205
        },
        {
            id: 'stakestack',
            title: 'Stake Stack',
            description: 'Stack your wins in this addictive multiplayer betting game.',
            thumbnailUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=600&q=80',
            url: 'https://play.stakestack.fun/',
            category: 'arcade',
            players: 843
        },
        {
            id: 'killers-arena',
            title: 'Killers Arena',
            description: 'Intense multiplayer shooter. Battle for ETH in the arena.',
            thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
            url: 'https://desktop.killersarena.fun/',
            category: 'multiplayer',
            players: 312
        }
    ],
    activeGame: null,
    isGameModalOpen: false,
    setActiveGame: (game) => set({ activeGame: game, isGameModalOpen: !!game }),
    setGameModalOpen: (isOpen) => set({ isGameModalOpen: isOpen, activeGame: isOpen ? undefined : null }) // Keep activeGame if opening, clear if closing? 
    // Actually, if closing, we should probably clear activeGame.
    // Let's refine: setGameModalOpen(false) -> activeGame: null
}));
