import { MessageSquare, Plus, Settings } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

interface MobileNavBarProps {
    onNewChat: () => void;
    onSettings: () => void;
}

export const MobileNavBar = ({ onNewChat, onSettings }: MobileNavBarProps) => {
    const { setMobileView, mobileView } = useChatStore();

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
