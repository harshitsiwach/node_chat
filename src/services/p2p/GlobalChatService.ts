import { joinRoom } from 'trystero/torrent';

export interface P2PMessage {
    id: string;
    text: string;
    sender: string; // Wallet Address or Name
    timestamp: number;
    type: 'text' | 'image' | 'audio';
    mediaUrl?: string;
}

class GlobalChatService {
    private room: any;
    private sendAction: any;
    private onMessageListeners: ((msg: P2PMessage) => void)[] = [];
    private roomId = 'anon_chat_global_v1';

    constructor() {
        // Initialize lazily or on demand
    }

    connect(appId: string) {
        if (this.room) return;

        console.log('[GlobalChat] Connecting to P2P room:', this.roomId);
        this.room = joinRoom({ appId }, this.roomId);

        const [send, get] = this.room.makeAction('message');
        this.sendAction = send;

        get((data: P2PMessage, peerId: string) => {
            console.log('[GlobalChat] Received P2P message from:', peerId);
            this.notifyListeners(data);
        });

        this.room.onPeerJoin((peerId: string) => {
            console.log('[GlobalChat] Peer joined:', peerId);
        });

        this.room.onPeerLeave((peerId: string) => {
            console.log('[GlobalChat] Peer left:', peerId);
        });
    }

    sendMessage(message: P2PMessage) {
        if (!this.sendAction) {
            console.warn('[GlobalChat] Not connected');
            return;
        }
        this.sendAction(message);
        // Also notify self (Trystero doesn't loopback)
        // this.notifyListeners(message); // Optional: usually UI handles optimistic update
    }

    onMessage(callback: (msg: P2PMessage) => void) {
        this.onMessageListeners.push(callback);
        return () => {
            this.onMessageListeners = this.onMessageListeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(msg: P2PMessage) {
        this.onMessageListeners.forEach(l => l(msg));
    }

    disconnect() {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
    }
}

export const globalChatService = new GlobalChatService();
