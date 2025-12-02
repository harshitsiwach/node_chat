import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users, ArrowRight } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateChatModal = ({ isOpen, onClose }: CreateChatModalProps) => {
    const [mode, setMode] = useState<'direct' | 'group'>('direct');
    const [address, setAddress] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState('');

    const { createDirectChat, createGroupChat } = useChatStore();
    const { addNotification } = useNotificationStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'direct') {
            if (!address.trim()) {
                addNotification('error', 'Wallet address is required');
                return;
            }
            createDirectChat(address);
            addNotification('success', `Started chat with ${address.slice(0, 6)}...`);
        } else {
            if (!groupName.trim()) {
                addNotification('error', 'Group name is required');
                return;
            }
            const members = groupMembers.split(',').map(m => m.trim()).filter(Boolean);
            if (members.length === 0) {
                addNotification('error', 'At least one member address is required');
                return;
            }
            createGroupChat(groupName, members);
            addNotification('success', `Created group "${groupName}"`);
        }

        // Reset and close
        setAddress('');
        setGroupName('');
        setGroupMembers('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-md bg-cyber-black border border-cyber-yellow p-6 relative shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                    >
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 bg-cyber-yellow"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 bg-cyber-yellow"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyber-yellow"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyber-yellow"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-cyber-yellow font-mono text-xl tracking-wider">INIT_CONNECTION</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setMode('direct')}
                                className={`flex-1 py-2 font-mono text-sm border transition-colors ${mode === 'direct'
                                        ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                                        : 'text-gray-400 border-gray-700 hover:border-cyber-yellow'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    DIRECT
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('group')}
                                className={`flex-1 py-2 font-mono text-sm border transition-colors ${mode === 'group'
                                        ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                                        : 'text-gray-400 border-gray-700 hover:border-cyber-yellow'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" />
                                    GROUP
                                </div>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'direct' ? (
                                <div>
                                    <label className="block text-xs font-mono text-cyber-yellow mb-2">TARGET_ADDRESS</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-mono text-cyber-yellow mb-2">GROUP_ID</label>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="Enter group name"
                                            className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-cyber-yellow mb-2">PARTICIPANTS (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={groupMembers}
                                            onChange={(e) => setGroupMembers(e.target.value)}
                                            placeholder="0x123..., 0xabc..."
                                            className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-cyber-gray border border-cyber-yellow text-cyber-yellow py-3 font-mono text-sm hover:bg-cyber-yellow hover:text-cyber-black transition-all flex items-center justify-center gap-2 group"
                            >
                                ESTABLISH_LINK
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
