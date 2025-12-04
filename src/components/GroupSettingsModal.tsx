import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Image as ImageIcon, Link as LinkIcon, MessageSquare, Save } from 'lucide-react';
import { mockRelayService, type GroupMetadata } from '../services/relay/MockRelayService';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    currentFees?: GroupMetadata['fees'];
    isAdmin: boolean;
}

export const GroupSettingsModal = ({ isOpen, onClose, groupId, currentFees, isAdmin }: GroupSettingsModalProps) => {
    const [messageFee, setMessageFee] = useState(currentFees?.message || 0);
    const [mediaFee, setMediaFee] = useState(currentFees?.media || 0);
    const [linkFee, setLinkFee] = useState(currentFees?.link || 0);
    const [recipient, setRecipient] = useState(currentFees?.recipientAddress || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMessageFee(currentFees?.message || 0);
            setMediaFee(currentFees?.media || 0);
            setLinkFee(currentFees?.link || 0);
            setRecipient(currentFees?.recipientAddress || '');
        }
    }, [isOpen, currentFees]);

    const handleSave = async () => {
        setIsSaving(true);
        await mockRelayService.updateGroupSettings(groupId, {
            message: Number(messageFee),
            media: Number(mediaFee),
            link: Number(linkFee),
            recipientAddress: recipient
        });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-cyber-black border border-cyber-yellow p-6 relative shadow-[0_0_30px_rgba(255,215,0,0.1)]"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 border border-cyber-yellow text-cyber-yellow">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-mono font-bold text-white">GROUP_MONETIZATION</h2>
                            <p className="text-xs text-cyber-gray font-mono">x402 PAYMENT PROTOCOL</p>
                        </div>
                    </div>

                    {!isAdmin ? (
                        <div className="text-center py-8 text-red-500 font-mono">
                            ACCESS_DENIED: ADMIN_ONLY
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Recipient Wallet */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-cyber-yellow">PAYMENT_RECIPIENT (WALLET)</label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full bg-black/50 border border-gray-800 text-white px-3 py-2 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                />
                            </div>

                            {/* Fees Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-900 rounded text-gray-400">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-mono text-gray-400 block mb-1">MESSAGE_FEE (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={messageFee}
                                            onChange={(e) => setMessageFee(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-gray-800 text-white px-3 py-2 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-900 rounded text-gray-400">
                                        <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-mono text-gray-400 block mb-1">MEDIA_FEE (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={mediaFee}
                                            onChange={(e) => setMediaFee(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-gray-800 text-white px-3 py-2 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-900 rounded text-gray-400">
                                        <LinkIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-mono text-gray-400 block mb-1">LINK_FEE (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={linkFee}
                                            onChange={(e) => setLinkFee(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-gray-800 text-white px-3 py-2 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 bg-cyber-yellow text-black font-bold py-3 hover:bg-white transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'SAVING...' : 'SAVE_CONFIGURATION'}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
