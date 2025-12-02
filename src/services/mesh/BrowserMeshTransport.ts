import type { MeshMessage, MeshPeer, TransportInterface } from './types';

export class BrowserMeshTransport implements TransportInterface {
    private channel: BroadcastChannel;
    private peerDiscoveryChannel: BroadcastChannel;
    private myId: string;
    private myName: string;
    private peers: Map<string, MeshPeer> = new Map();

    private onPeerDiscoveredCallback?: (peer: MeshPeer) => void;
    private onMessageReceivedCallback?: (message: MeshMessage) => void;

    constructor(myId: string, myName: string) {
        this.myId = myId;
        this.myName = myName;
        this.channel = new BroadcastChannel('mesh_chat_channel');
        this.peerDiscoveryChannel = new BroadcastChannel('mesh_discovery_channel');

        this.setupListeners();
    }

    private setupListeners() {
        this.channel.onmessage = (event) => {
            const message = event.data as MeshMessage;
            if (message.senderId !== this.myId) {
                this.onMessageReceivedCallback?.(message);
            }
        };

        this.peerDiscoveryChannel.onmessage = (event) => {
            const { type, peer } = event.data;
            if (type === 'announce' && peer.id !== this.myId) {
                this.peers.set(peer.id, peer);
                this.onPeerDiscoveredCallback?.(peer);
                // Respond to announcement so they know I exist too
                this.announcePresence();
            }
        };
    }

    private announcePresence() {
        const me: MeshPeer = {
            id: this.myId,
            name: this.myName,
            lastSeen: Date.now(),
            rssi: -Math.floor(Math.random() * 40 + 40) // Simulate RSSI -40 to -80
        };
        this.peerDiscoveryChannel.postMessage({ type: 'announce', peer: me });
    }

    async startDiscovery(): Promise<void> {
        console.log('[BrowserMesh] Starting discovery...');
        this.announcePresence();
        // Announce periodically
        setInterval(() => this.announcePresence(), 5000);
    }

    async stopDiscovery(): Promise<void> {
        console.log('[BrowserMesh] Stopping discovery...');
        // In a real app, we'd clear intervals and close channels
    }

    async sendMessage(_peerId: string, message: MeshMessage): Promise<void> {
        // In broadcast channel, everything is broadcast, but we can filter by recipient if we wanted.
        // For this simple mesh, we broadcast everything.
        this.channel.postMessage(message);
    }

    async broadcastMessage(message: MeshMessage): Promise<void> {
        this.channel.postMessage(message);
    }

    onPeerDiscovered(callback: (peer: MeshPeer) => void): void {
        this.onPeerDiscoveredCallback = callback;
    }

    onMessageReceived(callback: (message: MeshMessage) => void): void {
        this.onMessageReceivedCallback = callback;
    }
}
