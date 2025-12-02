import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TerminalInput } from './TerminalInput';
import { Hash, Lock, ChevronLeft } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { meshService } from '../services/mesh';
import { storageService } from '../services/storage';

export const ActiveChat = () => {
    const { activeChat, messages, addMessage, setMessages, setMobileView } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentMessages = activeChat ? (messages[activeChat] || []) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

    useEffect(() => {
        meshService.startScanning();
        return () => meshService.stopScanning();
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            if (activeChat) {
                const storedMessages = await storageService.getMessages(activeChat);
                if (storedMessages && storedMessages.length > 0) {
                    setMessages(activeChat, storedMessages);
                }
            }
        };
        loadMessages();
    }, [activeChat, setMessages]);

    const handleSendMessage = async (text: string, type: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string) => {
        if (!activeChat) return;

        const newMessage = {
            id: Date.now().toString(),
            text,
            isSent: true,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            sender: 'YOU',
            status: 'sent' as const,
            type,
            mediaUrl
        };

        addMessage(activeChat, newMessage);
        await storageService.saveMessage(activeChat, newMessage);
        await meshService.broadcastMessage(newMessage);
    };

    if (!activeChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-cyber-black text-gray-600 font-mono h-full">
                <div className="text-center">
                    <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>SELECT_TARGET_TO_BEGIN_TRANSMISSION</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-cyber-black relative overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-cyber-yellow flex items-center px-4 justify-between bg-cyber-black z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileView('list')}
                        className="md:hidden text-cyber-yellow hover:text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center text-cyber-yellow font-bold group cursor-default">
                        <Hash className="w-4 h-4 mr-2" />
                        <span className="relative">
                            <span className="relative z-10">{activeChat.toUpperCase()}</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center text-xs text-cyber-amber">
                    <Lock className="w-3 h-3 mr-1" />
                    ENCRYPTED
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-cyber-yellow scrollbar-track-cyber-gray">
                {currentMessages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        text={msg.text}
                        isSent={msg.isSent}
                        timestamp={msg.timestamp}
                        sender={msg.sender}
                        type={msg.type}
                        mediaUrl={msg.mediaUrl}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="h-16 border-t border-cyber-yellow p-4 bg-cyber-black z-10">
                <TerminalInput onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
};
