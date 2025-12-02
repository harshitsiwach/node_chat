import { useState } from 'react';
import { Terminal, Shield, Database, Settings, Plus } from 'lucide-react';
import { useAccount } from 'wagmi';
import { CreateChatModal } from './CreateChatModal';
import { SettingsModal } from './SettingsModal';

export const Sidebar = () => {
    const { address, isConnected } = useAccount();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div className="w-16 md:w-20 h-full border-r border-cyber-gray flex flex-col items-center py-6 bg-cyber-black z-20 relative">
            <div className="mb-8 text-cyber-yellow animate-pulse">
                <Terminal className="w-8 h-8" />
            </div>

            <nav className="flex-1 flex flex-col gap-6 w-full items-center">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-3 text-cyber-black bg-cyber-yellow hover:bg-white transition-colors relative group"
                    title="New Chat"
                >
                    <Plus className="w-5 h-5" />
                    <div className="absolute inset-0 border border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <div className="w-8 h-[1px] bg-gray-800 my-2"></div>

                <button className="p-3 text-gray-500 hover:text-cyber-yellow transition-colors relative group">
                    <Shield className="w-6 h-6" />
                    <span className="absolute left-14 bg-cyber-gray text-cyber-yellow text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cyber-yellow">
                        SECURE_CHANNELS
                    </span>
                </button>
                <button className="p-3 text-gray-500 hover:text-cyber-yellow transition-colors relative group">
                    <Database className="w-6 h-6" />
                    <span className="absolute left-14 bg-cyber-gray text-cyber-yellow text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cyber-yellow">
                        DATA_VAULT
                    </span>
                </button>
            </nav>

            <div className="mt-auto flex flex-col gap-4 items-center">
                <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="p-3 text-gray-500 hover:text-cyber-yellow transition-colors"
                >
                    <Settings className="w-6 h-6" />
                </button>
                {isConnected && address && (
                    <div className="text-[10px] font-mono text-cyber-yellow -rotate-90 mb-8 whitespace-nowrap tracking-wider opacity-50">
                        {truncateAddress(address)}
                    </div>
                )}
            </div>

            <CreateChatModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
};
