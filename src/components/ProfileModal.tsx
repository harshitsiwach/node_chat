import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogOut, Copy, Check } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useDisconnect } from 'wagmi';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
    const { currentUser, setCurrentUser } = useChatStore();
    const { disconnect } = useDisconnect();
    const [copied, setCopied] = useState(false);

    const handleLogout = () => {
        disconnect();
        setCurrentUser(null);
        localStorage.removeItem('guest_identity');
        onClose();
    };

    const handleCopy = () => {
        if (currentUser?.address) {
            navigator.clipboard.writeText(currentUser.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md bg-cyber-black border border-cyber-yellow p-6 relative shadow-[0_0_30px_rgba(255,215,0,0.1)]"
                    >
                        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                            <h2 className="text-cyber-yellow font-mono text-lg flex items-center gap-2">
                                <User className="w-5 h-5" />
                                USER_PROFILE
                            </h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-cyber-gray rounded-full flex items-center justify-center border border-cyber-yellow">
                                    <User className="w-8 h-8 text-cyber-yellow" />
                                </div>
                                <div>
                                    <h3 className="text-white font-mono text-lg">{currentUser?.name || 'ANONYMOUS'}</h3>
                                    <span className="text-xs text-green-500 font-mono flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        ONLINE_SECURE
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-2">WALLET_ADDRESS</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/50 border border-gray-700 text-gray-300 p-3 font-mono text-xs break-all">
                                        {currentUser?.address}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="px-3 border border-gray-700 hover:border-cyber-yellow hover:text-cyber-yellow transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-800">
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-3 border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors font-mono text-sm flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    TERMINATE_SESSION
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
