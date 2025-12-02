import type { WifiMessage, WifiPeer, WifiTransportInterface } from './types';

export class BrowserWifiTransport implements WifiTransportInterface {
    private channel: BroadcastChannel;
    private discoveryInterval: number | null = null;
    private onMessageCallback: ((message: WifiMessage) => void) | null = null;
    private onPeerFoundCallback: ((peer: WifiPeer) => void) | null = null;
    private peerId: string;

    constructor() {
        this.channel = new BroadcastChannel('anon_chat_wifi_v1');
        this.peerId = 'wifi_' + Math.random().toString(36).substr(2, 9);

        this.channel.onmessage = (event) => {
            const data = event.data;
            if (data.type === 'discovery') {
                if (this.onPeerFoundCallback && data.peerId !== this.peerId) {
                    this.onPeerFoundCallback({
                        id: data.peerId,
                        name: data.peerName,
                        address: data.peerId, // In simulation, ID is address
                        lastSeen: Date.now(),
                        status: 'active'
                    });

                    // Respond to discovery to announce ourselves
                    this.announce();
                }
            } else if (data.type === 'message') {
                if (this.onMessageCallback) {
                    this.onMessageCallback(data.message);
                }
            }
        };
    }

    private announce() {
        const currentUser = localStorage.getItem('guest_identity');
        let name = 'Unknown Wifi Node';
        if (currentUser) {
            try {
                const parsed = JSON.parse(currentUser);
                name = `Guest_${parsed.address.slice(0, 4)}`;
            } catch (e) {
                console.error('Failed to parse user identity', e);
            }
        }

        this.channel.postMessage({
            type: 'discovery',
            peerId: this.peerId,
            peerName: name
        });
    }

    async startDiscovery(onPeerFound: (peer: WifiPeer) => void): Promise<void> {
        this.onPeerFoundCallback = onPeerFound;
        this.announce();
        this.discoveryInterval = window.setInterval(() => this.announce(), 5000);
    }

    async stopDiscovery(): Promise<void> {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
        }
        this.onPeerFoundCallback = null;
    }

    async sendMessage(_peerId: string, message: WifiMessage): Promise<void> {
        // In broadcast channel simulation, we broadcast to everyone
        this.channel.postMessage({
            type: 'message',
            message
        });
    }

    onMessage(callback: (message: WifiMessage) => void): void {
        this.onMessageCallback = callback;
    }

    async disconnect(): Promise<void> {
        await this.stopDiscovery();
        this.channel.close();
    }
}
