import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users, ArrowRight, LogIn } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { mockRelayService } from '../services/relay/MockRelayService';

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateChatModal = ({ isOpen, onClose }: CreateChatModalProps) => {
    const [mode, setMode] = useState<'direct' | 'create_group' | 'join_group'>('direct');
    const [address, setAddress] = useState('');
    const [groupName, setGroupName] = useState('');
    const [nftContract, setNftContract] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [groupIdToJoin, setGroupIdToJoin] = useState('');

    const { createDirectChat, createGroupChat, currentUser } = useChatStore();
    const { addNotification } = useNotificationStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'direct') {
            if (!address.trim()) {
                addNotification('error', 'Wallet address is required');
                return;
            }
            createDirectChat(address);
            addNotification('success', `Started chat with ${address.slice(0, 6)}...`);
            onClose();
        } else if (mode === 'create_group') {
            if (!groupName.trim()) {
                addNotification('error', 'Group name is required');
                return;
            }
            if (!nftContract.trim()) {
                addNotification('error', 'NFT Contract Address is required');
                return;
            }

            try {
                // Create on Relay
                await mockRelayService.createGroup(
                    groupName,
                    currentUser?.address || '',
                    nftContract,
                    tokenId || undefined
                );

                // Create Locally
                createGroupChat(groupName, [currentUser?.address || ''], {
                    nftContract,
                    tokenId,
                    ownerWallet: currentUser?.address,
                    groupKey: 'simulated_key' // In real app, this comes from relay
                });

                addNotification('success', `Created NFT-gated group "${groupName}"`);
                onClose();
            } catch (error) {
                console.error("Group creation failed", error);
                addNotification('error', 'Failed to create group');
            }
        } else if (mode === 'join_group') {
            if (!groupIdToJoin.trim()) {
                addNotification('error', 'Group ID is required');
                return;
            }

            try {
                const result = await mockRelayService.joinGroup(groupIdToJoin, currentUser?.address || '');
                if (result.success) {
                    // Fetch group details (mock)
                    const groups = await mockRelayService.getGroups();
                    const group = groups.find(g => g.id === groupIdToJoin);

                    if (group) {
                        createGroupChat(group.name, group.members, {
                            nftContract: group.nftContract,
                            tokenId: group.tokenId,
                            ownerWallet: group.ownerWallet,
                            groupKey: result.groupKey
                        });
                        addNotification('success', `Joined group "${group.name}"`);
                        onClose();
                    }
                } else {
                    addNotification('error', result.error || 'Failed to join group');
                }
            } catch (error) {
                console.error("Join failed", error);
                addNotification('error', 'Failed to join group');
            }
        }

        // Reset fields
        setAddress('');
        setGroupName('');
        setNftContract('');
        setTokenId('');
        setGroupIdToJoin('');
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

                        <div className="flex gap-2 mb-6 overflow-x-auto">
                            <button
                                onClick={() => setMode('direct')}
                                className={`flex-1 py-2 px-2 font-mono text-[10px] border transition-colors whitespace-nowrap ${mode === 'direct'
                                    ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                                    : 'text-gray-400 border-gray-700 hover:border-cyber-yellow'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <UserPlus className="w-3 h-3" />
                                    DIRECT
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('create_group')}
                                className={`flex-1 py-2 px-2 font-mono text-[10px] border transition-colors whitespace-nowrap ${mode === 'create_group'
                                    ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                                    : 'text-gray-400 border-gray-700 hover:border-cyber-yellow'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <Users className="w-3 h-3" />
                                    CREATE GROUP
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('join_group')}
                                className={`flex-1 py-2 px-2 font-mono text-[10px] border transition-colors whitespace-nowrap ${mode === 'join_group'
                                    ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                                    : 'text-gray-400 border-gray-700 hover:border-cyber-yellow'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <LogIn className="w-3 h-3" />
                                    JOIN GROUP
                                </div>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'direct' && (
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
                            )}

                            {mode === 'create_group' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-mono text-cyber-yellow mb-2">GROUP_NAME</label>
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
                                        <label className="block text-xs font-mono text-cyber-yellow mb-2">NFT_CONTRACT (BASE SEPOLIA)</label>
                                        <input
                                            type="text"
                                            value={nftContract}
                                            onChange={(e) => setNftContract(e.target.value)}
                                            placeholder="0x..."
                                            className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-cyber-yellow mb-2">TOKEN_ID (OPTIONAL)</label>
                                        <input
                                            type="text"
                                            value={tokenId}
                                            onChange={(e) => setTokenId(e.target.value)}
                                            placeholder="For ERC-1155"
                                            className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {mode === 'join_group' && (
                                <div>
                                    <label className="block text-xs font-mono text-cyber-yellow mb-2">GROUP_ID</label>
                                    <input
                                        type="text"
                                        value={groupIdToJoin}
                                        onChange={(e) => setGroupIdToJoin(e.target.value)}
                                        placeholder="group_..."
                                        className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-cyber-gray border border-cyber-yellow text-cyber-yellow py-3 font-mono text-sm hover:bg-cyber-yellow hover:text-cyber-black transition-all flex items-center justify-center gap-2 group"
                            >
                                {mode === 'join_group' ? 'VERIFY_AND_JOIN' : 'ESTABLISH_LINK'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
