
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TerminalInput } from './TerminalInput';
import { Hash, Lock, ChevronLeft, Bluetooth } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { meshService } from '../services/mesh/MeshService';
import { storageService } from '../services/storage';

export const ActiveChat = () => {
    const { activeChat, messages, addMessage, setMessages, setMobileView, isOfflineMode, currentUser } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentMessages = activeChat ? (messages[activeChat] || []) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

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

    // Listen for incoming mesh messages
    useEffect(() => {
        if (isOfflineMode) {
            meshService.onMessage((msg) => {
                if (activeChat) {
                    addMessage(activeChat, {
                        id: msg.id,
                        text: msg.text,
                        isSent: false,
                        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        sender: msg.senderName,
                        status: 'read',
                        type: 'text',
                        isMesh: true
                    });
                }
            });
        }
    }, [isOfflineMode, activeChat, addMessage]);

    const handleSendMessage = async (text: string, type: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string) => {
        if (!activeChat || !currentUser) return;

        const newMessage = {
            id: Date.now().toString(),
            text,
            isSent: true,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            sender: 'YOU',
            status: 'sent' as const,
            type,
            mediaUrl,
            isMesh: isOfflineMode
        };

        addMessage(activeChat, newMessage);
        await storageService.saveMessage(activeChat, newMessage);

        if (isOfflineMode) {
            await meshService.sendMessage(text, currentUser.id, currentUser.name);
        } else {
            // Normal online sending logic (stubbed)
        }
    };

    if (!activeChat) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-cyber-black flex-col text-cyber-gray">
                <Hash className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-mono text-sm">SELECT_CHANNEL_TO_BEGIN</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-cyber-black relative overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-cyber-yellow flex items-center px-4 justify-between bg-cyber-black z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMobileView('list')}
                        className="md:hidden text-cyber-yellow hover:text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    {isOfflineMode ? (
                        <div className="flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded border border-blue-500/30">
                            <Bluetooth className="w-3 h-3 text-blue-400 animate-pulse" />
                            <span className="text-[10px] font-mono text-blue-400">MESH_NET</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                            <span className="text-[10px] font-mono text-gray-500">ENCRYPTED_V2</span>
                        </>
                    )}
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
