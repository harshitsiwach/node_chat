import { useChatStore } from '../store/useChatStore';

// Mock implementation of a Mesh Network Service
// In a real app, this would interface with Bluetooth LE / WebRTC

class MeshService {
    private isScanning = false;
    private peers: Set<string> = new Set();

    startScanning() {
        if (this.isScanning) return;
        this.isScanning = true;
        console.log('[MESH] Scanning for local peers...');

        // Simulate finding peers
        setInterval(() => {
            const mockPeerId = Math.random() > 0.5 ? 'ghost' : 'viper';
            this.handlePeerDiscovery(mockPeerId);
        }, 5000);
    }

    stopScanning() {
        this.isScanning = false;
        console.log('[MESH] Stopped scanning.');
    }

    private handlePeerDiscovery(peerId: string) {
        if (!this.peers.has(peerId)) {
            this.peers.add(peerId);
            console.log(`[MESH] Discovered peer: ${peerId}`);
            useChatStore.getState().updatePeerStatus(peerId, 'online');
        }
    }

    broadcastMessage(message: any) {
        console.log('[MESH] Broadcasting message:', message);
        // Simulate network delay and delivery
        return new Promise((resolve) => setTimeout(resolve, 500));
    }
}

export const meshService = new MeshService();
