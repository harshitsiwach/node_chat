import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, AlertTriangle } from 'lucide-react';

interface GuestKeyModalProps {
    address: string;
    privateKey: string;
    onConfirm: () => void;
}

export const GuestKeyModal = ({ address, privateKey, onConfirm }: GuestKeyModalProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(`Address: ${address}\nPrivate Key: ${privateKey}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-cyber-black border border-red-500 p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
                <div className="flex items-center gap-3 mb-6 text-red-500">
                    <Shield className="w-8 h-8" />
                    <h2 className="text-xl font-mono font-bold">IDENTITY_GENERATED</h2>
                </div>

                <div className="bg-red-500/10 border border-red-500/50 p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                    <p className="text-xs font-mono text-red-200">
                        WARNING: This is a temporary guest identity. Save your Private Key immediately.
                        If you lose this key, you lose access to this account forever.
                        We do not store your keys.
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1">PUBLIC_ADDRESS</label>
                        <div className="bg-black border border-gray-800 p-3 font-mono text-sm text-cyber-yellow break-all">
                            {address}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1">PRIVATE_KEY</label>
                        <div className="bg-black border border-gray-800 p-3 font-mono text-sm text-red-400 break-all blur-sm hover:blur-none transition-all cursor-pointer" title="Hover to reveal">
                            {privateKey}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleCopy}
                        className="flex-1 py-3 border border-gray-700 text-gray-400 font-mono text-xs hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'COPIED_TO_CLIPBOARD' : 'COPY_CREDENTIALS'}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 bg-red-500 text-black font-mono text-xs font-bold hover:bg-red-400 transition-colors"
                    >
                        I_HAVE_SECURED_MY_KEYS
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
