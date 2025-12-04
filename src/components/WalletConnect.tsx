import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { useState, useEffect } from 'react';
import { Shield, Terminal, Globe } from 'lucide-react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { useChatStore } from '../store/useChatStore';
import { GuestKeyModal } from './GuestKeyModal';
import { KeyManager } from '../services/crypto/KeyManager';
import { mockRelayService } from '../services/relay/MockRelayService';
import { supabaseRelayService } from '../services/relay/SupabaseRelayService';

export const WalletConnect = () => {
    const { address, isConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const { signMessageAsync } = useSignMessage();
    const { currentUser, setCurrentUser, setMessagingKeyPair } = useChatStore();
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestCreds, setGuestCreds] = useState<{ address: string; privateKey: string } | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Handle Wallet Connection & Key Generation
    useEffect(() => {
        const initializeKeys = async () => {
            if (isConnected && address && !currentUser && !isAuthenticating) {
                setIsAuthenticating(true);
                try {
                    // 1. Request Signature
                    // We request a signature to prove identity, but for this demo we don't strictly use it 
                    // to derive the key (using random instead for simplicity). 
                    // In a real app, we'd use PBKDF2 on this signature.
                    await signMessageAsync({
                        message: `Login to NODE Chat\nWallet: ${address}\nTimestamp: ${Date.now()}`,
                    });

                    // 2. Derive Wrapping Key (Simulated "Login")
                    // In a real app, we'd try to unwrap an existing key from local storage first.
                    // For this demo, we'll just generate a fresh identity keypair for the session.
                    // Or we could store it in localStorage encrypted. Let's do fresh for simplicity/security demo.

                    const keyPair = await KeyManager.generateIdentityKeyPair();
                    const publicKeyBase64 = await KeyManager.exportPublicKey(keyPair.publicKey);

                    // 3. Register with Relay (Supabase & Mock)
                    await mockRelayService.registerUser(address, publicKeyBase64);
                    await supabaseRelayService.registerUser(address, publicKeyBase64);

                    // 4. Update Store
                    setMessagingKeyPair(keyPair);
                    setCurrentUser({
                        id: address,
                        name: `User_${address.slice(0, 4)}`,
                        address: address
                    });

                } catch (error) {
                    console.error("Auth failed:", error);
                    // Disconnect or show error
                } finally {
                    setIsAuthenticating(false);
                }
            }
        };

        initializeKeys();
    }, [isConnected, address, currentUser, signMessageAsync, setCurrentUser, setMessagingKeyPair, isAuthenticating]);

    const handleGuestLogin = () => {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        setGuestCreds({ address: account.address, privateKey });
        setShowGuestModal(true);
    };

    const confirmGuestLogin = async () => {
        if (guestCreds) {
            // For guests, we also generate a messaging keypair
            const keyPair = await KeyManager.generateIdentityKeyPair();
            const publicKeyBase64 = await KeyManager.exportPublicKey(keyPair.publicKey);

            await mockRelayService.registerUser(guestCreds.address, publicKeyBase64);
            await supabaseRelayService.registerUser(guestCreds.address, publicKeyBase64);
            setMessagingKeyPair(keyPair);

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
