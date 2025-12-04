import { useGameStore } from '../store/useGameStore';
import { Gamepad2, Users, Play, X } from 'lucide-react';

interface GamesViewProps {
    onClose: () => void;
}

export const GamesView = ({ onClose }: GamesViewProps) => {
    const { games, setActiveGame } = useGameStore();

    return (
        <div className="absolute inset-0 z-40 bg-cyber-black flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Gamepad2 className="w-6 h-6 text-cyber-yellow" />
                    <h2 className="text-xl font-mono text-white tracking-wider">ARCADE_NEXUS</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Header (Mock) */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Active Players</div>
                            <div className="text-xl font-mono text-white">2,450 <span className="text-green-500 text-xs">+15%</span></div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Total Bets (24h)</div>
                            <div className="text-xl font-mono text-white">450 ETH <span className="text-green-500 text-xs">+8%</span></div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Jackpot Pool</div>
                            <div className="text-xl font-mono text-white">1,200 ETH</div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">New Games</div>
                            <div className="text-xl font-mono text-white">3 <span className="text-cyber-yellow text-xs">NEW</span></div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-xs font-mono text-gray-400 uppercase tracking-wider">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-5">Game</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-2 text-right">Players</div>
                            <div className="col-span-2 text-right">Action</div>
                        </div>

                        <div className="divide-y divide-gray-800">
                            {games.map((game, index) => (
                                <div
                                    key={game.id}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                                >
                                    <div className="col-span-1 text-center font-mono text-gray-500">{index + 1}</div>
                                    <div className="col-span-5 flex items-center gap-4">
                                        <img
                                            src={game.thumbnailUrl}
                                            alt={game.title}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <div>
                                            <div className="font-bold text-white group-hover:text-cyber-yellow transition-colors">{game.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{game.description}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="px-2 py-1 rounded bg-gray-800 text-xs font-mono text-gray-300 uppercase">
                                            {game.category}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-gray-400 flex items-center justify-end gap-2">
                                        <Users className="w-3 h-3" /> {game.players}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <button
                                            onClick={() => setActiveGame(game)}
                                            className="px-4 py-2 bg-cyber-yellow text-black hover:bg-white transition-all text-xs font-bold rounded flex items-center justify-center gap-2 ml-auto"
                                        >
                                            <Play className="w-3 h-3 fill-current" />
                                            PLAY
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
