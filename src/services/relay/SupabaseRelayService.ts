import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseMessage {
    id: string;
    conversation_id: string;
    sender_wallet: string;
    ciphertext: string;
    iv: string;
    created_at: string;
}

class SupabaseRelayService {
    private supabase: SupabaseClient | null = null;

    constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
            console.log('[Supabase] Initialized');
        } else {
            console.warn('[Supabase] Missing credentials in .env');
        }
    }

    isConfigured(): boolean {
        return !!this.supabase;
    }

    async registerUser(walletAddress: string, publicKey: string) {
        if (!this.supabase) return;

        const { error } = await this.supabase
            .from('profiles')
            .upsert({
                wallet_address: walletAddress,
                public_key: publicKey,
                last_seen: new Date().toISOString()
            });

        if (error) console.error('[Supabase] Register Error:', error);
        else console.log('[Supabase] User registered:', walletAddress);
    }

    async getUserPublicKey(walletAddress: string): Promise<string | null> {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('profiles')
            .select('public_key')
            .eq('wallet_address', walletAddress)
            .single();

        if (error || !data) return null;
        return data.public_key;
    }

    async sendMessage(conversationId: string, senderWallet: string, ciphertext: string, iv: string) {
        if (!this.supabase) return;

        // Ensure conversation exists (idempotent)
        // In a real app, we'd check first or handle foreign key error, 
        // but for speed we'll assume it exists or we create it lazily.
        // For this demo, let's just insert the message. If conversation_id is FK, we need to create it.

        // 1. Try insert message
        const { error } = await this.supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_wallet: senderWallet,
                ciphertext,
                iv
            });

        if (error) {
            // If FK error, create conversation first
            if (error.code === '23503') { // Foreign key violation
                await this.createConversation(conversationId, [senderWallet]); // Participants incomplete but fine for now
                // Retry insert
                await this.supabase.from('messages').insert({
                    conversation_id: conversationId,
                    sender_wallet: senderWallet,
                    ciphertext,
                    iv
                });
            } else {
                console.error('[Supabase] Send Message Error:', error);
            }
        }
    }

    async createConversation(id: string, participants: string[]) {
        if (!this.supabase) return;
        const { error } = await this.supabase
            .from('conversations')
            .upsert({ id, participants }); // Upsert to avoid duplicate error

        if (error) console.error('[Supabase] Create Conversation Error:', error);
    }

    async getMessages(conversationId: string): Promise<SupabaseMessage[]> {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Supabase] Get Messages Error:', error);
            return [];
        }
        return data as SupabaseMessage[];
    }

    subscribeToMessages(callback: (msg: SupabaseMessage) => void) {
        if (!this.supabase) return () => { };

        const channel = this.supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    callback(payload.new as SupabaseMessage);
                }
            )
            .subscribe();

        return () => {
            this.supabase?.removeChannel(channel);
        };
    }
}

export const supabaseRelayService = new SupabaseRelayService();
