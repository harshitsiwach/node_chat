export interface WifiPeer {
    id: string;
    name: string;
    address: string; // IP address or unique identifier
    lastSeen: number;
    status: 'active' | 'inactive';
}

export interface WifiMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    channelId?: string; // For group chats
}

export interface WifiTransportInterface {
    startDiscovery(onPeerFound: (peer: WifiPeer) => void): Promise<void>;
    stopDiscovery(): Promise<void>;
    sendMessage(peerId: string, message: WifiMessage): Promise<void>;
    onMessage(callback: (message: WifiMessage) => void): void;
    disconnect(): Promise<void>;
}
