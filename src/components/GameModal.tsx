import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { X, Maximize2, Minimize2, Wallet } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';

export const GameModal = () => {
    const { activeGame, setActiveGame } = useGameStore();
    const { addNotification } = useNotificationStore();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);



    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'REQUEST_TRANSACTION') {
                const { amount, currency } = event.data;

                // Simulate Wallet Interaction
                const confirm = window.confirm(`Game requests transaction:\nAmount: ${amount} ${currency}\n\nApprove?`);

                if (confirm) {
                    addNotification('info', 'Processing transaction...');
                    setTimeout(() => {
                        addNotification('success', 'Transaction confirmed!');
                        // Notify Game
                        if (iframeRef.current?.contentWindow) {
                            iframeRef.current.contentWindow.postMessage({ type: 'TRANSACTION_SUCCESS' }, '*');
                        }
                    }, 1500);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [addNotification]);

    if (!activeGame) return null;

    return (
        <div className={`fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 ${isFullscreen ? 'p-0' : ''}`}>
            <div className={`bg-cyber-black border border-cyber-yellow w-full h-full flex flex-col relative ${isFullscreen ? 'max-w-none max-h-none border-none' : 'max-w-6xl max-h-[90vh] rounded-lg'}`}>

                {/* Header */}
                <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-cyber-yellow" />
                        <span className="font-mono text-sm text-white">CONNECTED: 0x123...456</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setActiveGame(null)} className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Game Iframe */}
                <div className="flex-1 bg-black relative">
                    <iframe
                        ref={iframeRef}
                        src={activeGame.url}
                        className="w-full h-full border-none"
                        title="Game"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
};
