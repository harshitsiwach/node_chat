import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatList } from './ChatList';
import { ActiveChat } from './ActiveChat';
import { NotificationToast } from './NotificationToast';
import { WelcomeModal } from './WelcomeModal';
import { MobileNavBar } from './MobileNavBar';
import { CreateChatModal } from './CreateChatModal';
import { SettingsModal } from './SettingsModal';
import { useChatStore } from '../store/useChatStore';

export const Layout = () => {
    const [showWelcome, setShowWelcome] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const { mobileView } = useChatStore();

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
        </div>
    );
};
