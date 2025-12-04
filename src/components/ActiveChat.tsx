
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
import { globalChatService } from '../services/p2p/GlobalChatService';
import { supabaseRelayService, type SupabaseMessage } from '../services/relay/SupabaseRelayService';
import { GroupSettingsModal } from './GroupSettingsModal';
import { Settings } from 'lucide-react';
import { useState } from 'react';

export const ActiveChat = () => {
    const { activeChat, messages, addMessage, setMessages, setMobileView, isOfflineMode, isWifiMode, currentUser, messagingKeyPair, chats } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentMessages = activeChat ? (messages[activeChat] || []) : [];
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<any>(null);

    useEffect(() => {
        const fetchGroup = async () => {
            if (activeChat) {
                const groups = await mockRelayService.getGroups();
                const group = groups.find(g => g.id === activeChat);
                setCurrentGroup(group);
            }
        };
        fetchGroup();
    }, [activeChat]);

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

    // Helper to persist and add message
    const handleIncomingMessage = async (chatId: string, msg: any) => {
        addMessage(chatId, msg);
        await storageService.saveMessage(chatId, msg);
    };

    // Listen for incoming mesh messages
    useEffect(() => {
        if (isOfflineMode) {
            meshService.onMessage((msg) => {
                if (activeChat) {
                    handleIncomingMessage(activeChat, {
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
    }, [isOfflineMode, activeChat, handleIncomingMessage]);

    // Listen for incoming wifi messages
    useEffect(() => {
        if (isWifiMode) {
            wifiService.onMessage((msg) => {
                if (activeChat) {
                    handleIncomingMessage(activeChat, {
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
    }, [isWifiMode, activeChat, handleIncomingMessage]);

    // Connect to Global Chat P2P on mount
    useEffect(() => {
        globalChatService.connect('anon_chat_app');

        const unsubscribe = globalChatService.onMessage((msg) => {
            if (activeChat === 'global_public_channel') {
                handleIncomingMessage('global_public_channel', {
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
    }, [activeChat, handleIncomingMessage]);

    // Listen for incoming Relay messages (DM only now, Global is P2P)
    useEffect(() => {
        if (!isOfflineMode && !isWifiMode) {
            const unsubscribe = mockRelayService.onMessage(async (relayMsg) => {
                if (relayMsg.conversationId === 'global_public_channel') return;

                handleIncomingMessage(relayMsg.conversationId, {
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
    }, [isOfflineMode, isWifiMode, handleIncomingMessage, currentUser]);

    // Listen for incoming Supabase messages (DMs)
    useEffect(() => {
        if (!isOfflineMode && !isWifiMode && activeChat) {
            const unsubscribe = supabaseRelayService.subscribeToMessages(async (msg: SupabaseMessage) => {
                if (msg.conversation_id === activeChat) {
                    if (msg.sender_wallet === currentUser?.address) return;

                    let text = "[Encrypted Message]";
                    // Decrypt logic
                    if (activeChat === 'global_public_channel') {
                        text = msg.ciphertext;
                    } else {
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
                    }

                    handleIncomingMessage(activeChat, {
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
    }, [isOfflineMode, isWifiMode, activeChat, currentUser, messagingKeyPair, chats, handleIncomingMessage]);

    // Load History from Supabase on chat switch (Smart Sync)
    useEffect(() => {
        const loadHistory = async () => {
            if (activeChat && !isOfflineMode && !isWifiMode) {
                if (supabaseRelayService.isConfigured()) {
                    // 1. Get latest local message timestamp
                    const localMessages = await storageService.getMessages(activeChat);
                    // let lastTimestamp = null; // Unused for now
                    if (localMessages && localMessages.length > 0) {
                        // Assuming messages are sorted or we find the max
                        // Timestamps are stored as locale strings in store, but we need ISO for comparison?
                        // Wait, storageService saves the `Message` object. 
                        // The `timestamp` in `Message` is `toLocaleTimeString`. We lost the ISO date!
                        // We need to fix storage to save ISO or use `id` if it's sortable (it is Date.now()).
                        // `id` is string, but derived from Date.now().

                        // Let's use the ID to find the latest one, assuming ID ~ timestamp.
                        // Or better, we rely on the fact that we only want *new* messages.
                        // But Supabase `created_at` is real time.

                        // Workaround: We'll fetch all for now but filter locally? No, that defeats the purpose.
                        // We need to store the `createdAt` ISO in the message object for sync purposes.
                        // Since we don't have it in the current `Message` interface, we'll fetch all but ONLY process new ones.
                        // OPTIMIZATION V2: Add `isoTimestamp` to Message interface.

                        // For now, let's just optimize the DECRYPTION loop.
                        // We will check if ID exists in `localMessages` before decrypting.
                    }

                    // Fetch from Supabase (fetching all for now as we lack ISO timestamp in store)
                    // TODO: Add ISO timestamp to store for true incremental fetch
                    const history = await supabaseRelayService.getMessages(activeChat);

                    const newMessages: any[] = [];
                    const promises = history.map(async (msg) => {
                        // Skip if we already have this message ID
                        if (localMessages?.some(m => m.id === msg.id)) return;

                        let text = "[Encrypted Message]";
                        let isDecrypted = false;

                        // Decrypt
                        if (activeChat === 'global_public_channel') {
                            // Global chat is plaintext in Supabase for now (or we could use a shared key, but let's assume plaintext for public)
                            // Actually, SupabaseRelayService expects ciphertext. 
                            // For Global, we can store plaintext as "ciphertext" or use a known public key.
                            // Let's assume we store it as plaintext in ciphertext field for Global, OR we use a fixed key.
                            // Simpler: Just treat ciphertext as text for Global.
                            text = msg.ciphertext;
                            isDecrypted = true;
                        } else {
                            if (msg.sender_wallet === currentUser?.address) {
                                // Sent by us
                                const chat = chats.find(c => c.id === activeChat);
                                const otherAddress = chat?.participants.find(p => p !== currentUser?.address);
                                if (otherAddress && messagingKeyPair) {
                                    const otherPubKeyBase64 = await supabaseRelayService.getUserPublicKey(otherAddress);
                                    if (otherPubKeyBase64) {
                                        const otherPubKey = await KeyManager.importPublicKey(otherPubKeyBase64);
                                        const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, otherPubKey);
                                        try {
                                            text = await KeyManager.decrypt(sharedKey, msg.ciphertext, msg.iv);
                                            isDecrypted = true;
                                        } catch (e) { console.error("History decryption failed", e); }
                                    }
                                }
                            } else {
                                // Received
                                const chat = chats.find(c => c.id === activeChat);
                                const senderAddress = chat?.participants.find(p => p !== currentUser?.address);
                                if (senderAddress && messagingKeyPair && msg.sender_wallet === senderAddress) {
                                    const senderPubKeyBase64 = await supabaseRelayService.getUserPublicKey(senderAddress);
                                    if (senderPubKeyBase64) {
                                        const senderPubKey = await KeyManager.importPublicKey(senderPubKeyBase64);
                                        const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, senderPubKey);
                                        try {
                                            text = await KeyManager.decrypt(sharedKey, msg.ciphertext, msg.iv);
                                            isDecrypted = true;
                                        } catch (e) { console.error("History decryption failed", e); }
                                    }
                                }
                            }
                        }

                        if (isDecrypted || msg.sender_wallet === currentUser?.address) {
                            newMessages.push({
                                id: msg.id,
                                text: text,
                                isSent: msg.sender_wallet === currentUser?.address,
                                timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                sender: msg.sender_wallet === currentUser?.address ? 'YOU' : msg.sender_wallet.slice(0, 6),
                                status: 'read',
                                type: 'text',
                                isMesh: false
                            });
                        }
                    });

                    await Promise.all(promises);

                    if (newMessages.length > 0) {
                        // Sort by ID/Timestamp
                        newMessages.sort((a, b) => Number(a.id) - Number(b.id));

                        // Batch add to store and storage
                        // Note: addMessage doesn't support batch, so we loop. 
                        // But at least we did the heavy decryption in parallel and skipped existing ones.
                        for (const m of newMessages) {
                            // Use handleIncomingMessage? No, that's for single.
                            // We can just call saveMessage directly here as we did before.
                            addMessage(activeChat, m);
                            await storageService.saveMessage(activeChat, m);
                        }
                    }
                }
            }
        };
        loadHistory();
    }, [activeChat, isOfflineMode, isWifiMode, currentUser, messagingKeyPair, chats, addMessage]);


    const handleSendMessage = async (text: string, type: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string) => {
        if (!activeChat || !currentUser) return;

        // Check for fees (x402)
        if (currentGroup?.fees && currentGroup.ownerWallet !== currentUser.address) {
            let fee = 0;
            if (type === 'text') {
                // Check if it contains a link
                const hasLink = /https?:\/\/[^\s]+/.test(text);
                if (hasLink) fee = currentGroup.fees.link || 0;
                else fee = currentGroup.fees.message || 0;
            } else {
                fee = currentGroup.fees.media || 0;
            }

            if (fee > 0) {
                const confirmPayment = window.confirm(`PAYMENT REQUIRED (x402)\n\nThis action requires a fee of ${fee} ETH.\nRecipient: ${currentGroup.fees.recipientAddress}\n\nProceed with payment?`);
                if (!confirmPayment) return;

                // Simulate payment delay
                // In real app, trigger wallet transaction here
                console.log(`[x402] Processing payment of ${fee} ETH...`);
                await new Promise(r => setTimeout(r, 1000));
                console.log(`[x402] Payment successful!`);
            }
        }

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
            // Global Channel -> Supabase (Persistent)
            if (activeChat === 'global_public_channel') {
                // For Global, we send plaintext as "ciphertext" for now, or use a fixed IV
                // To keep it compatible with the schema, we pass empty IV or dummy
                await supabaseRelayService.sendMessage(activeChat, currentUser.address, text, 'public_iv');
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
                <div className="flex items-center gap-4">
                    {/* Admin Settings Button */}
                    {currentGroup?.ownerWallet === currentUser?.address && (
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-cyber-gray hover:text-cyber-yellow transition-colors"
                            title="Group Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex items-center text-xs text-cyber-amber">
                        <Lock className="w-3 h-3 mr-1" />
                        ENCRYPTED
                    </div>
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

            {/* Settings Modal */}
            <GroupSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                groupId={activeChat}
                currentFees={currentGroup?.fees}
                isAdmin={currentGroup?.ownerWallet === currentUser?.address}
            />
        </div>
    );
};
