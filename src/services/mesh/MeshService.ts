import { BrowserMeshTransport } from './BrowserMeshTransport';
import type { MeshMessage, MeshPeer, TransportInterface } from './types';

class MeshService {
    private transport: TransportInterface | null = null;
    private isRunning = false;

    initialize(myId: string, myName: string) {
        // Determine environment. For now, we default to Browser Simulation.
        // In a real app, check if (Capacitor.isNativePlatform())
        this.transport = new BrowserMeshTransport(myId, myName);
    }

    async start() {
        if (this.transport && !this.isRunning) {
            await this.transport.startDiscovery();
            this.isRunning = true;
        }
    }

    async stop() {
        if (this.transport && this.isRunning) {
            await this.transport.stopDiscovery();
            this.isRunning = false;
        }
    }

    async sendMessage(text: string, senderId: string, senderName: string) {
        if (!this.transport) return;

        const message: MeshMessage = {
            id: Date.now().toString(),
            senderId,
            senderName,
            text,
            timestamp: Date.now()
        };

        await this.transport.broadcastMessage(message);
        return message;
    }

    onPeerFound(callback: (peer: MeshPeer) => void) {
        this.transport?.onPeerDiscovered(callback);
    }

    onMessage(callback: (message: MeshMessage) => void) {
        this.transport?.onMessageReceived(callback);
    }
}

export const meshService = new MeshService();
