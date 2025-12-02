import { BrowserWifiTransport } from './BrowserWifiTransport';
import type { WifiMessage, WifiPeer, WifiTransportInterface } from './types';

class WifiService {
    private transport: WifiTransportInterface | null = null;
    private messageCallback: ((msg: WifiMessage) => void) | null = null;

    constructor() {
        // In a real app, we'd check platform and use NativeWifiTransport
        this.transport = new BrowserWifiTransport();
    }

    async start(onPeerFound: (peer: WifiPeer) => void) {
        if (this.transport) {
            await this.transport.startDiscovery(onPeerFound);
            this.transport.onMessage((msg) => {
                if (this.messageCallback) {
                    this.messageCallback(msg);
                }
            });
        }
    }

    async stop() {
        if (this.transport) {
            await this.transport.stopDiscovery();
        }
    }

    async sendMessage(text: string, senderId: string, senderName: string) {
        if (!this.transport) return;

        const message: WifiMessage = {
            id: Date.now().toString(),
            text,
            senderId,
            senderName,
            timestamp: Date.now()
        };

        await this.transport.sendMessage('broadcast', message);
    }

    onMessage(callback: (msg: WifiMessage) => void) {
        this.messageCallback = callback;
    }
}

export const wifiService = new WifiService();
