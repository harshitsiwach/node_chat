
import { Bluetooth, X, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';
import type { MeshPeer } from '../services/mesh/types';

interface RadarViewProps {
    onClose: () => void;
}

export const RadarView = ({ onClose }: RadarViewProps) => {
    const { peers, createDirectChat } = useChatStore();

    // Generate random positions for peers (stable based on ID)
    const getPosition = (id: string) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const angle = (hash % 360) * (Math.PI / 180);
        const distance = 30 + (hash % 40); // 30-70% from center
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance
        };
    };

    const handlePeerClick = (peer: MeshPeer) => {
        createDirectChat(peer.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
            <button
                onClick={onClose}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="text-center mb-12">
                <h2 className="text-3xl font-mono text-cyber-yellow mb-2 tracking-widest flex items-center justify-center gap-3">
                    <Bluetooth className="w-8 h-8 animate-pulse" />
                    MESH_RADAR
                </h2>
                <p className="text-blue-400 font-mono text-sm">SCANNING_LOCAL_FREQUENCIES...</p>
            </div>

            <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center">
                {/* Radar Rings */}
                <div className="absolute inset-0 border border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-[15%] border border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-[30%] border border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-[45%] border border-blue-500/20 rounded-full"></div>

                {/* Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-blue-500/20"></div>
                    <div className="h-full w-[1px] bg-blue-500/20 absolute"></div>
                </div>

                {/* Scanner Line */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute w-1/2 h-1/2 origin-bottom-right top-0 left-0 border-r border-blue-500/50 bg-gradient-to-l from-blue-500/20 to-transparent"
                    style={{ borderBottomRightRadius: '100%' }}
                />

                {/* Center (You) */}
                <div className="absolute w-4 h-4 bg-cyber-yellow rounded-full shadow-[0_0_15px_#FFD700] z-10">
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-cyber-yellow">
                        YOU
                    </div>
                </div>

                {/* Peers */}
                <AnimatePresence>
                    {peers.map((peer) => {
                        const pos = getPosition(peer.id);
                        return (
                            <motion.button
                                key={peer.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.2 }}
                                onClick={() => handlePeerClick(peer)}
                                className="absolute w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#60A5FA] z-20 group cursor-pointer"
                                style={{
                                    left: `${50 + pos.x}% `,
                                    top: `${50 + pos.y}% `
                                }}
                            >
                                {/* Peer Label */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 border border-blue-500/50 px-2 py-1 rounded text-[10px] font-mono text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                                    {peer.name}
                                    <div className="text-[8px] text-gray-500">{peer.id.slice(0, 6)}...</div>
                                </div>

                                {/* Ping Animation */}
                                <div className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-50"></div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="mt-12 flex gap-8 text-xs font-mono text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyber-yellow rounded-full"></div>
                    <span>SELF_NODE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>ACTIVE_PEER</span>
                </div>
                <div className="flex items-center gap-2">
                    <Wifi className="w-3 h-3" />
                    <span>{peers.length} NODES_DETECTED</span>
                </div>
            </div>
        </div>
    );
};
