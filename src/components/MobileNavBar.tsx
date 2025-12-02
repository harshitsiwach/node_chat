import { MessageSquare, Plus, Settings, Radio } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

interface MobileNavBarProps {
    onNewChat: () => void;
    onSettings: () => void;
    onNetwork: () => void;
}

export const MobileNavBar = ({ onNewChat, onSettings, onNetwork }: MobileNavBarProps) => {
    const { setMobileView, mobileView, isOfflineMode, isWifiMode } = useChatStore();
    const isNetworkActive = isOfflineMode || isWifiMode;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-cyber-black border-t border-gray-800 flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom)]">
            <button
                onClick={() => setMobileView('list')}
                className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'list' ? 'text-cyber-yellow' : 'text-gray-500'
                    }`}
            >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-mono">CHATS</span>
            </button>

            <button
                onClick={onNetwork}
                className={`flex flex-col items-center gap-1 p-2 ${isNetworkActive ? 'text-blue-400' : 'text-gray-500'} hover:text-blue-300`}
            >
                <Radio className={`w-5 h-5 ${isNetworkActive ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-mono">NET</span>
            </button>

            <button
                onClick={onNewChat}
                className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-cyber-yellow"
            >
                <Plus className="w-5 h-5" />
                <span className="text-[10px] font-mono">NEW</span>
            </button>

            <button
                onClick={onSettings}
                className="flex flex-col items-center gap-1 p-2 text-gray-500 hover:text-cyber-yellow"
            >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-mono">CONFIG</span>
            </button>
        </div>
    );
};
