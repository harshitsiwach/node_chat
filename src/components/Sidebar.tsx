import { useState, useEffect } from 'react';
import { Settings, Plus, Bluetooth, Wifi, Radar } from 'lucide-react';
import { CreateChatModal } from './CreateChatModal';
import { SettingsModal } from './SettingsModal';
import { RadarView } from './RadarView';
import { useChatStore } from '../store/useChatStore';
import { meshService } from '../services/mesh/MeshService';
import { wifiService } from '../services/wifi/WifiService';

export const Sidebar = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isRadarOpen, setIsRadarOpen] = useState(false);
    const { currentUser, isOfflineMode, setOfflineMode, isWifiMode, setWifiMode, peers, addPeer, addWifiPeer, joinGlobalChannel } = useChatStore();

    useEffect(() => {
        joinGlobalChannel();
    }, [joinGlobalChannel]);

    useEffect(() => {
        if (isOfflineMode && currentUser) {
            meshService.start((peer) => addPeer(peer));
        } else {
            meshService.stop();
        }
    }, [isOfflineMode, currentUser, addPeer]);

    useEffect(() => {
        if (isWifiMode && currentUser) {
            wifiService.start((peer) => addWifiPeer(peer));
        } else {
            wifiService.stop();
        }
    }, [isWifiMode, currentUser, addWifiPeer]);

    // This part was originally inside the meshService useEffect, but the instruction implies it's now separate or handled differently.
    // Keeping it here for context, but it's not part of the explicit instruction to move/change it.
    // If meshService.start now handles peer finding, this onMessage handler might need to be re-evaluated.
    useEffect(() => {
        if (currentUser) { // Assuming message handling is always active if currentUser exists
            meshService.onMessage((msg) => {
                // For demo, we just dump everything into a "Public Mesh" chat or the active chat
                // Ideally, we'd route based on channelId
                console.log('Mesh Message Received:', msg);
            });
        } else {
            meshService.stop();
        }
    }, [isOfflineMode, currentUser, addPeer]);

    return (
        <div className="w-16 md:w-20 h-full bg-cyber-black border-r border-cyber-gray flex flex-col items-center py-6 gap-6 z-20">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-cyber-yellow flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                <span className="font-mono font-bold text-black text-xl">A</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 w-full items-center">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-cyber-yellow hover:text-black text-cyber-yellow flex items-center justify-center transition-all duration-300 group"
                    title="New Chat"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>

                <button
                    onClick={() => setOfflineMode(!isOfflineMode)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOfflineMode
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : 'bg-gray-800 text-gray-500 hover:text-white'
                        }`}
                    title={isOfflineMode ? "Disable Mesh Mode" : "Enable Mesh Mode"}
                >
                    <Bluetooth className={`w-5 h-5 ${isOfflineMode ? 'animate-pulse' : ''}`} />
                </button>

                <button
                    onClick={() => setWifiMode(!isWifiMode)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isWifiMode
                        ? 'bg-green-500/20 text-green-400 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                        : 'bg-gray-800 text-gray-500 hover:text-white'
                        }`}
                    title={isWifiMode ? "Disable Wi-Fi Mode" : "Enable Wi-Fi Mode"}
                >
                    <Wifi className={`w-5 h-5 ${isWifiMode ? 'animate-pulse' : ''}`} />
                </button>

                {(isOfflineMode || isWifiMode) && (
                    <button
                        onClick={() => setIsRadarOpen(true)}
                        className="w-10 h-10 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300 animate-pulse"
                        title="Open Radar"
                    >
                        <Radar className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-cyber-gray text-gray-400 hover:text-white flex items-center justify-center transition-all"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Peer Count (Offline Mode) */}
            {isOfflineMode && (
                <div className="mt-auto mb-4 flex flex-col items-center gap-1">
                    <div className="text-[10px] font-mono text-blue-400">PEERS</div>
                    <div className="text-xs font-bold text-white bg-blue-900/50 px-2 py-1 rounded border border-blue-500/30">
                        {peers.length}
                    </div>
                </div>
            )}

            <CreateChatModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />

            {isRadarOpen && <RadarView onClose={() => setIsRadarOpen(false)} />}
        </div>
    );
};
