import { useConnect, useAccount } from 'wagmi';
import { Shield, Terminal, AlertTriangle } from 'lucide-react';

export const WalletConnect = () => {
    const { connectors, connect, isPending, error } = useConnect();
    const { isConnected } = useAccount();

    if (isConnected) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-black/90 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 border border-cyber-yellow bg-cyber-black relative overflow-hidden">
                {/* Scanline effect for modal */}
                <div className="absolute inset-0 scanline pointer-events-none opacity-10"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="w-16 h-16 border border-cyber-yellow flex items-center justify-center mb-6 animate-pulse">
                        <Shield className="w-8 h-8 text-cyber-yellow" />
                    </div>

                    <h2 className="text-2xl font-mono font-bold text-cyber-yellow mb-2">
                        AUTHENTICATION REQUIRED
                    </h2>

                    <p className="text-gray-400 font-mono text-sm mb-8">
                        Connect your secure wallet to access the encrypted network.
                    </p>

                    <div className="w-full space-y-4">
                        {connectors.map((connector) => (
                            <button
                                key={connector.uid}
                                onClick={() => connect({ connector })}
                                disabled={isPending}
                                className="w-full p-4 border border-cyber-yellow text-cyber-yellow font-mono hover:bg-cyber-yellow hover:text-cyber-black transition-all duration-200 flex items-center justify-center group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center">
                                    <Terminal className="w-4 h-4 mr-2" />
                                    {isPending ? 'ESTABLISHING CONNECTION...' : `CONNECT VIA ${connector.name.toUpperCase()}`}
                                </span>
                                {/* Glitch hover effect */}
                                <div className="absolute inset-0 bg-cyber-yellow translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mt-6 p-3 border border-red-500 bg-red-500/10 text-red-500 text-xs font-mono flex items-center w-full">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {error.message}
                        </div>
                    )}

                    <div className="mt-8 text-[10px] text-gray-600 font-mono">
                        SECURE PROTOCOL V.1.0.4 // ENCRYPTED
                    </div>
                </div>
            </div>
        </div>
    );
};
