import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { supabaseRelayService, type SupabaseMessage } from '../services/relay/SupabaseRelayService';
import { KeyManager } from '../services/crypto/KeyManager';
import { useNotificationStore } from '../store/useNotificationStore';
import { storageService } from '../services/storage';

export const GlobalMessageListener = () => {
    const { currentUser, messagingKeyPair, chats, receiveMessage, createDirectChat, activeChat } = useChatStore();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (!currentUser || !messagingKeyPair) return;

        console.log('[GlobalListener] Subscribing to all messages...');

        const unsubscribe = supabaseRelayService.subscribeToMessages(async (msg: SupabaseMessage) => {
            // 1. Ignore own messages
            if (msg.sender_wallet === currentUser.address) return;

            // 2. Determine Chat ID
            // If it's Global Chat
            if (msg.conversation_id === 'global_public_channel') {
                // Process Global Chat
                const text = msg.ciphertext; // Plaintext for global
                const newMessage = {
                    id: msg.id,
                    text: text,
                    isSent: false,
                    timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    sender: msg.sender_wallet.slice(0, 6),
                    status: 'read' as const,
                    type: 'text' as const,
                    isMesh: false
                };
                receiveMessage('global_public_channel', newMessage);
                return;
            }

            // 3. It's a DM (Direct Message)
            const senderAddress = msg.sender_wallet;

            // Check if we have a chat with this sender
            // Our Chat IDs for DMs are usually the OTHER person's address
            // But wait, createDirectChat uses `address` as ID.
            let chatId = senderAddress;

            // Check if chat exists
            const chatExists = chats.find(c => c.id === chatId);

            if (!chatExists) {
                // NEW CHAT DISCOVERY!
                console.log('[GlobalListener] New Chat Discovery from:', senderAddress);
                createDirectChat(senderAddress);
                addNotification('info', `New message from ${senderAddress.slice(0, 6)}...`);
            }

            // 4. Decrypt
            let text = "[Encrypted Message]";
            try {
                const senderPubKeyBase64 = await supabaseRelayService.getUserPublicKey(senderAddress);
                if (senderPubKeyBase64) {
                    const senderPubKey = await KeyManager.importPublicKey(senderPubKeyBase64);
                    const sharedKey = await KeyManager.deriveSharedKey(messagingKeyPair.privateKey, senderPubKey);
                    text = await KeyManager.decrypt(sharedKey, msg.ciphertext, msg.iv);
                }
            } catch (e) {
                console.error('[GlobalListener] Decryption failed:', e);
            }

            // 5. Add to Store & Storage
            const newMessage = {
                id: msg.id,
                text: text,
                isSent: false,
                timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: senderAddress.slice(0, 6),
                status: 'read' as const,
                type: 'text' as const,
                isMesh: false
            };

            receiveMessage(chatId, newMessage);
            await storageService.saveMessage(chatId, newMessage);

            // 6. Notify if not active
            if (activeChat !== chatId) {
                // Optional: Sound or System Notification
            }

        });

        return () => {
            unsubscribe();
        };
    }, [currentUser, messagingKeyPair, chats, receiveMessage, createDirectChat, activeChat, addNotification]);

    return null; // Headless component
};
