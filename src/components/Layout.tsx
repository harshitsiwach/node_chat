import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatList } from './ChatList';
import { ActiveChat } from './ActiveChat';
import { NotificationToast } from './NotificationToast';
import { WelcomeModal } from './WelcomeModal';
import { MobileNavBar } from './MobileNavBar';
import { CreateChatModal } from './CreateChatModal';
import { SettingsModal } from './SettingsModal';
import { ProfileModal } from './ProfileModal';
import { useChatStore } from '../store/useChatStore';
import { User as UserIcon } from 'lucide-react';

export const Layout = () => {
    const [showWelcome, setShowWelcome] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { mobileView, currentUser } = useChatStore();

    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
            setShowWelcome(true);
        }
    }, []);

    const handleCloseWelcome = () => {
        localStorage.setItem('hasSeenWelcome', 'true');
        setShowWelcome(false);
    };

    return (
        <div className="flex h-screen w-screen bg-cyber-black overflow-hidden relative select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 bg-scanline opacity-10 mix-blend-overlay"></div>

            <NotificationToast />

            {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

            {/* Profile Button (Top Right) */}
            {currentUser && (
                <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="fixed top-4 right-4 z-[60] p-2 bg-cyber-black border border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow hover:text-black transition-all rounded-full shadow-[0_0_10px_rgba(255,215,0,0.2)]"
                >
                    <UserIcon className="w-5 h-5" />
                </button>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex w-full h-full">
                <Sidebar />
                <ChatList />
                <ActiveChat />
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex flex-col w-full h-full pb-16">
                {mobileView === 'list' ? (
                    <ChatList />
                ) : (
                    <ActiveChat />
                )}
                <MobileNavBar
                    onNewChat={() => setIsCreateModalOpen(true)}
                    onSettings={() => setIsSettingsModalOpen(true)}
                />
            </div>

            {/* Modals (Global) */}
            <CreateChatModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
};
