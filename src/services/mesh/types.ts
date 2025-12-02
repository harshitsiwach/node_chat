export interface MeshPeer {
    id: string;
    name: string;
    lastSeen: number;
    rssi?: number; // Signal strength (simulated or real)
}

export interface MeshMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    channelId?: string; // For group chats
}

export interface TransportInterface {
    startDiscovery: () => Promise<void>;
    stopDiscovery: () => Promise<void>;
    sendMessage: (peerId: string, message: MeshMessage) => Promise<void>;
    broadcastMessage: (message: MeshMessage) => Promise<void>;
    onPeerDiscovered: (callback: (peer: MeshPeer) => void) => void;
    onMessageReceived: (callback: (message: MeshMessage) => void) => void;
}
