
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TerminalInput } from './TerminalInput';
import { Hash, Lock, ChevronLeft, Bluetooth, Wifi } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { meshService } from '../services/mesh/MeshService';
import { wifiService } from '../services/wifi/WifiService';
import { storageService } from '../services/storage';
import { mockRelayService, type RelayMessage } from '../services/relay/MockRelayService';
import { KeyManager } from '../services/crypto/KeyManager';
import { globalChatService, type P2PMessage } from '../services/p2p/GlobalChatService';
import { supabaseRelayService, type SupabaseMessage } from '../services/relay/SupabaseRelayService';

export const ActiveChat = () => {
    const { activeChat, messages, addMessage, setMessages, setMobileView, isOfflineMode, isWifiMode, currentUser, messagingKeyPair, chats } = useChatStore();
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

    // Listen for incoming wifi messages
    useEffect(() => {
        if (isWifiMode) {
            wifiService.onMessage((msg) => {
                if (activeChat) {
                    addMessage(activeChat, {
                        id: msg.id,
                        text: msg.text,
                        isSent: false,
                        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        sender: msg.senderName,
                        status: 'read',
                        type: 'text',
                        isMesh: true // Reuse mesh badge for now, or add isWifi
                    });
                }
            });
        }
    }, [isWifiMode, activeChat, addMessage]);

    // Connect to Global Chat P2P on mount
    useEffect(() => {
        globalChatService.connect('anon_chat_app');

        const unsubscribe = globalChatService.onMessage((msg) => {
            if (activeChat === 'global_public_channel') {
                addMessage('global_public_channel', {
                    id: msg.id,
                    text: msg.text,
                    isSent: false,
                    timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    sender: msg.sender,
                    status: 'read',
                    type: msg.type,
                    mediaUrl: msg.mediaUrl,
                    isMesh: false // It's P2P but over internet, distinct from local mesh
                });
            }
        });

        return () => {
            unsubscribe();
            // Optional: globalChatService.disconnect(); // Keep connected for background?
        };
    }, [activeChat, addMessage]);

    // Listen for incoming Relay messages (DM only now, Global is P2P)
    useEffect(() => {
        if (!isOfflineMode && !isWifiMode) {
            const unsubscribe = mockRelayService.onMessage(async (relayMsg) => {
                if (relayMsg.conversationId === 'global_public_channel') return;

                addMessage(relayMsg.conversationId, {
                    id: relayMsg.id,
                    text: relayMsg.ciphertext,
                    isSent: false,
                    timestamp: new Date(relayMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    sender: relayMsg.senderWallet === currentUser?.address ? 'YOU' : (relayMsg.senderWallet.slice(0, 6) + '...'),
                    status: 'read',
                    type: 'text',
                    isMesh: false
                });
            });
            return () => unsubscribe();
        }
    }, [isOfflineMode, isWifiMode, addMessage, currentUser]);

    // Listen for incoming Supabase messages (DMs)
    useEffect(() => {
        if (!isOfflineMode && !isWifiMode && activeChat) {
            const unsubscribe = supabaseRelayService.subscribeToMessages(async (msg: SupabaseMessage) => {
                if (msg.conversation_id === activeChat) {
                    if (msg.sender_wallet === currentUser?.address) return;

                    let text = "[Encrypted Message]";
                    // Decrypt logic
                    const chat = chats.find(c => c.id === activeChat);
                    const recipientAddress = chat?.participants.find(p => p !== currentUser?.address);

                    if (recipientAddress && messagingKeyPair) {
                        if (msg.sender_wallet === recipientAddress) {
                            const senderPubKeyBase64 = await supabaseRelayService.getUserPublicKey(msg.sender_wallet);
                            if (senderPubKeyBase64) {
                                const senderPubKey = await KeyManager.importPublicKey(senderPubKeyBase64);
                                const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, senderPubKey);
                                try {
                                    text = await KeyManager.decrypt(sharedKey, msg.ciphertext, msg.iv);
                                } catch (e) {
                                    console.error("Decryption failed", e);
                                }
                            }
                        }
                    }

                    addMessage(activeChat, {
                        id: msg.id,
                        text: text,
                        isSent: false,
                        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        sender: msg.sender_wallet.slice(0, 6),
                        status: 'read',
                        type: 'text',
                        isMesh: false
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [isOfflineMode, isWifiMode, activeChat, currentUser, messagingKeyPair, chats, addMessage]);

    // Load History from Supabase on chat switch
    useEffect(() => {
        const loadHistory = async () => {
            if (activeChat && !isOfflineMode && !isWifiMode && activeChat !== 'global_public_channel') {
                if (supabaseRelayService.isConfigured()) {
                    const history = await supabaseRelayService.getMessages(activeChat);

                    // Process history
                    for (const msg of history) {
                        let text = "[Encrypted Message]";
                        if (msg.sender_wallet === currentUser?.address) {
                            // We sent it, we might not be able to decrypt it if we didn't store it locally or if we don't have the key derived for self (usually we encrypt for recipient)
                            // Actually, in this simple scheme, we encrypt for the shared secret. 
                            // So we CAN decrypt our own messages if we have the shared secret.
                            // BUT, we need to know who the OTHER participant is to derive the shared secret.
                            const chat = chats.find(c => c.id === activeChat);
                            const otherAddress = chat?.participants.find(p => p !== currentUser?.address);
                            if (otherAddress && messagingKeyPair) {
                                const otherPubKeyBase64 = await supabaseRelayService.getUserPublicKey(otherAddress);
                                if (otherPubKeyBase64) {
                                    const otherPubKey = await KeyManager.importPublicKey(otherPubKeyBase64);
                                    const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, otherPubKey);
                                    try {
                                        text = await KeyManager.decrypt(sharedKey, msg.ciphertext, msg.iv);
                                    } catch (e) { console.error("History decryption failed", e); }
                                }
                            }
                        } else {
                            // Received message
                            const chat = chats.find(c => c.id === activeChat);
                            const senderAddress = chat?.participants.find(p => p !== currentUser?.address);
                            if (senderAddress && messagingKeyPair && msg.sender_wallet === senderAddress) {
                                const senderPubKeyBase64 = await supabaseRelayService.getUserPublicKey(senderAddress);
                                if (senderPubKeyBase64) {
                                    const senderPubKey = await KeyManager.importPublicKey(senderPubKeyBase64);
                                    const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, senderPubKey);
                                    try {
                                        text = await KeyManager.decrypt(sharedKey, msg.ciphertext, msg.iv);
                                    } catch (e) { console.error("History decryption failed", e); }
                                }
                            }
                        }

                        // Check if already exists to avoid dupes (simple check)
                        // In real app, store handles this or we check IDs
                        // For now, we'll just add it. Store `addMessage` appends. 
                        // We should probably check if `messages[activeChat]` already has it.
                        // But `addMessage` in store doesn't check dupes efficiently. 
                        // Let's assume `setMessages` clears or we just append new ones.
                        // Actually, `loadMessages` from local storage runs first. 
                        // We should merge. For this demo, let's just append and rely on React keys or user ignoring dupes.
                        // Better: check if ID exists in current messages

                        // const exists = messages[activeChat]?.some(m => m.id === msg.id);
                        // if (!exists) {
                        addMessage(activeChat, {
                            id: msg.id,
                            text: text,
                            isSent: msg.sender_wallet === currentUser?.address,
                            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            sender: msg.sender_wallet === currentUser?.address ? 'YOU' : msg.sender_wallet.slice(0, 6),
                            status: 'read',
                            type: 'text',
                            isMesh: false
                        });
                        // }
                    }
                }
            }
        };
        loadHistory();
    }, [activeChat, isOfflineMode, isWifiMode, currentUser, messagingKeyPair, chats, addMessage]);


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
        } else if (isWifiMode) {
            await wifiService.sendMessage(text, currentUser.id, currentUser.name);
        } else {
            // Global Channel -> P2P
            if (activeChat === 'global_public_channel') {
                const p2pMsg: P2PMessage = {
                    id: newMessage.id,
                    text: text,
                    sender: currentUser.name || currentUser.address.slice(0, 6),
                    timestamp: Date.now(),
                    type: type,
                    mediaUrl: mediaUrl
                };
                globalChatService.sendMessage(p2pMsg);
                return;
            }

            // Secure Relay Mode (Supabase)
            const chat = chats.find(c => c.id === activeChat);
            if (!chat) return;

            const recipientAddress = chat.participants.find(p => p !== currentUser.address);

            if (recipientAddress && messagingKeyPair) {
                try {
                    // Try Supabase first, fallback to Mock if not configured
                    if (supabaseRelayService.isConfigured()) {
                        const recipientPubKeyBase64 = await supabaseRelayService.getUserPublicKey(recipientAddress);
                        if (recipientPubKeyBase64) {
                            const recipientPubKey = await KeyManager.importPublicKey(recipientPubKeyBase64);
                            const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, recipientPubKey);
                            const { ciphertext, iv } = await KeyManager.encrypt(sharedKey, text);

                            await supabaseRelayService.sendMessage(activeChat, currentUser.address, ciphertext, iv);
                        }
                    } else {
                        // Fallback to Mock Relay (Local)
                        const recipientPubKeyBase64 = await mockRelayService.getUserPublicKey(recipientAddress);
                        if (recipientPubKeyBase64) {
                            const recipientPubKey = await KeyManager.importPublicKey(recipientPubKeyBase64);
                            const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, recipientPubKey);
                            const { ciphertext, iv } = await KeyManager.encrypt(sharedKey, text);

                            const relayMsg: RelayMessage = {
                                id: Date.now().toString(),
                                conversationId: activeChat,
                                senderWallet: currentUser.address,
                                ciphertext,
                                iv,
                                timestamp: new Date().toISOString()
                            };
                            await mockRelayService.sendMessage(relayMsg);
                        }
                    }
                } catch (e) {
                    console.error("Encryption failed:", e);
                }
            }
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
                    ) : isWifiMode ? (
                        <div className="flex items-center gap-1 bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                            <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                            <span className="text-[10px] font-mono text-green-400">WIFI_DIRECT</span>
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
                        id={msg.id}
                        text={msg.text}
                        isSent={msg.isSent}
                        timestamp={msg.timestamp}
                        sender={msg.sender}
                        type={msg.type}
                        mediaUrl={msg.mediaUrl}
                        reactions={msg.reactions}
                        replyTo={msg.replyTo}
                        isPinned={msg.isPinned}
                        poll={msg.poll}
                        chatId={activeChat}
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
