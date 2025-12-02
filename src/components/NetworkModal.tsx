import { X, Bluetooth, Wifi, Radar } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { motion } from 'framer-motion';

interface NetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenRadar: () => void;
}

export const NetworkModal = ({ isOpen, onClose, onOpenRadar }: NetworkModalProps) => {
    const { isOfflineMode, setOfflineMode, isWifiMode, setWifiMode, peers, wifiPeers } = useChatStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full sm:max-w-md bg-cyber-black border-t sm:border border-cyber-yellow p-6 rounded-t-2xl sm:rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.1)]"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-mono text-cyber-yellow tracking-wider">NETWORK_CONTROLS</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Bluetooth Mesh Toggle */}
                    <button
                        onClick={() => setOfflineMode(!isOfflineMode)}
                        className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${isOfflineMode
                            ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                            : 'bg-gray-900/50 border-gray-700 text-gray-500'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Bluetooth className={`w-6 h-6 ${isOfflineMode ? 'animate-pulse' : ''}`} />
                            <div className="text-left">
                                <div className="font-mono font-bold">BLUETOOTH_MESH</div>
                                <div className="text-xs opacity-70">
                                    {isOfflineMode ? 'ACTIVE - SCANNING' : 'INACTIVE'}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs font-mono">
                            {peers.length} PEERS
                        </div>
                    </button>

                    {/* Wi-Fi Direct Toggle */}
                    <button
                        onClick={() => setWifiMode(!isWifiMode)}
                        className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${isWifiMode
                            ? 'bg-green-900/20 border-green-500 text-green-400'
                            : 'bg-gray-900/50 border-gray-700 text-gray-500'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Wifi className={`w-6 h-6 ${isWifiMode ? 'animate-pulse' : ''}`} />
                            <div className="text-left">
                                <div className="font-mono font-bold">WIFI_DIRECT</div>
                                <div className="text-xs opacity-70">
                                    {isWifiMode ? 'ACTIVE - SCANNING' : 'INACTIVE'}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs font-mono">
                            {wifiPeers.length} PEERS
                        </div>
                    </button>

                    {/* Radar Trigger */}
                    {(isOfflineMode || isWifiMode) && (
                        <button
                            onClick={() => {
                                onOpenRadar();
                                onClose();
                            }}
                            className="w-full p-4 mt-4 bg-purple-900/20 border border-purple-500 text-purple-400 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-900/40 transition-all animate-pulse"
                        >
                            <Radar className="w-6 h-6" />
                            <span className="font-mono font-bold tracking-widest">OPEN_RADAR</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
