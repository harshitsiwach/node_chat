import { useAccount, useConnect } from 'wagmi';
import { useState } from 'react';
import { Shield, Terminal, Globe } from 'lucide-react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { useChatStore } from '../store/useChatStore';
import { GuestKeyModal } from './GuestKeyModal';

export const WalletConnect = () => {
    const { isConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const { currentUser, setCurrentUser } = useChatStore();
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestCreds, setGuestCreds] = useState<{ address: string; privateKey: string } | null>(null);

    const handleGuestLogin = () => {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        setGuestCreds({ address: account.address, privateKey });
        setShowGuestModal(true);
    };

    const confirmGuestLogin = () => {
        if (guestCreds) {
            setCurrentUser({
                id: guestCreds.address,
                name: `Guest_${guestCreds.address.slice(0, 4)}`,
                address: guestCreds.address
            });
            localStorage.setItem('guest_identity', JSON.stringify(guestCreds));
            setShowGuestModal(false);
        }
    };

    if (isConnected || currentUser) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="w-full max-w-md p-8 border border-cyber-yellow bg-cyber-black relative shadow-[0_0_50px_rgba(255,215,0,0.1)]">
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-yellow"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-yellow"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-yellow"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-yellow"></div>

                    <div className="text-center mb-8">
                        <Shield className="w-16 h-16 text-cyber-yellow mx-auto mb-4 animate-pulse" />
                        <h2 className="text-2xl font-mono text-white mb-2 tracking-widest">AUTHENTICATION_REQUIRED</h2>
                        <p className="text-gray-500 font-mono text-sm">ESTABLISH_SECURE_UPLINK</p>
                    </div>

                    <div className="space-y-4">
                        {connectors.map((connector) => (
                            <button
                                key={connector.uid}
                                onClick={() => connect({ connector })}
                                className="w-full py-4 border border-gray-700 hover:border-cyber-yellow text-gray-400 hover:text-cyber-yellow transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-3 group"
                            >
                                <Terminal className="w-4 h-4 group-hover:animate-bounce" />
                                CONNECT_VIA_{connector.name.toUpperCase()}
                            </button>
                        ))}

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-800"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-600 font-mono text-xs">OR</span>
                            <div className="flex-grow border-t border-gray-800"></div>
                        </div>

                        <button
                            onClick={handleGuestLogin}
                            className="w-full py-4 bg-cyber-gray border border-gray-600 hover:border-white text-white transition-all font-mono text-sm tracking-wider flex items-center justify-center gap-3"
                        >
                            <Globe className="w-4 h-4" />
                            GENERATE_GUEST_IDENTITY
                        </button>
                    </div>
                </div>
            </div>

            {showGuestModal && guestCreds && (
                <GuestKeyModal
                    address={guestCreds.address}
                    privateKey={guestCreds.privateKey}
                    onConfirm={confirmGuestLogin}
                />
            )}
        </>
    );
};
