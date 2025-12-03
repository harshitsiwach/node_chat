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

    // Direct Chat State
    const [address, setAddress] = useState('');

    // Group Wizard State
    const [wizardStep, setWizardStep] = useState<'details' | 'deploying' | 'success'>('details');
    const [groupName, setGroupName] = useState('');
    const [maxSupply, setMaxSupply] = useState('100');
    const [deployedContract, setDeployedContract] = useState('');

    // Join Group State
    const [groupIdToJoin, setGroupIdToJoin] = useState('');

    const { createDirectChat, createGroupChat, currentUser } = useChatStore();
    const { addNotification } = useNotificationStore();

    const resetState = () => {
        setMode('direct');
        setAddress('');
        setWizardStep('details');
        setGroupName('');
        setMaxSupply('100');
        setDeployedContract('');
        setGroupIdToJoin('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleDirectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.trim()) {
            addNotification('error', 'Wallet address is required');
            return;
        }
        createDirectChat(address);
        addNotification('success', `Started chat with ${address.slice(0, 6)}...`);
        handleClose();
    };

    const handleDeployGroup = async () => {
        if (!groupName.trim()) {
            addNotification('error', 'Group name is required');
            return;
        }

        setWizardStep('deploying');

        try {
            // Simulate Deploy
            const contract = await mockRelayService.deployGroupContract(groupName, 'GRP', parseInt(maxSupply));
            setDeployedContract(contract);
            setWizardStep('success');
            addNotification('success', 'Contract Deployed Successfully!');
        } catch (error) {
            console.error("Deploy failed", error);
            addNotification('error', 'Deployment failed');
            setWizardStep('details');
        }
    };

    const handleMintAndCreate = async () => {
        if (!currentUser) return;

        try {
            // 1. Mint Membership (Simulated)
            await mockRelayService.mintMembership(deployedContract, currentUser.address);

            // 2. Create Group on Relay
            await mockRelayService.createGroup(
                groupName,
                currentUser.address,
                deployedContract,
                undefined, // No tokenId for this flow
                parseInt(maxSupply)
            );

            // 3. Create Locally
            createGroupChat(groupName, [currentUser.address], {
                nftContract: deployedContract,
                ownerWallet: currentUser.address,
                groupKey: 'simulated_key'
            });

            addNotification('success', `Group "${groupName}" created & joined!`);
            handleClose();
        } catch (error) {
            console.error("Creation failed", error);
            addNotification('error', 'Failed to create group');
        }
    };

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupIdToJoin.trim()) {
            addNotification('error', 'Group ID is required');
            return;
        }

        try {
            const result = await mockRelayService.joinGroup(groupIdToJoin, currentUser?.address || '');
            if (result.success) {
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
                    handleClose();
                }
            } else {
                // If failed due to NFT, maybe offer to mint?
                // For now just show error
                addNotification('error', result.error || 'Failed to join group');
            }
        } catch (error) {
            console.error("Join failed", error);
            addNotification('error', 'Failed to join group');
        }
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
                            <h2 className="text-cyber-yellow font-mono text-xl tracking-wider">
                                {mode === 'create_group' ? 'DEPLOY_CONTRACT' : 'INIT_CONNECTION'}
                            </h2>
                            <button onClick={handleClose} className="text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Mode Switcher (Only show if not deep in wizard) */}
                        {!(mode === 'create_group' && wizardStep !== 'details') && (
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
                        )}

                        {/* Direct Chat Form */}
                        {mode === 'direct' && (
                            <form onSubmit={handleDirectSubmit} className="space-y-4">
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
                                <button
                                    type="submit"
                                    className="w-full bg-cyber-gray border border-cyber-yellow text-cyber-yellow py-3 font-mono text-sm hover:bg-cyber-yellow hover:text-cyber-black transition-all flex items-center justify-center gap-2 group"
                                >
                                    ESTABLISH_LINK
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        )}

                        {/* Create Group Wizard */}
                        {mode === 'create_group' && (
                            <div className="space-y-4">
                                {wizardStep === 'details' && (
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
                                            <label className="block text-xs font-mono text-cyber-yellow mb-2">MAX_PARTICIPANTS (SUPPLY)</label>
                                            <input
                                                type="number"
                                                value={maxSupply}
                                                onChange={(e) => setMaxSupply(e.target.value)}
                                                placeholder="100"
                                                className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleDeployGroup}
                                            className="w-full bg-cyber-gray border border-cyber-yellow text-cyber-yellow py-3 font-mono text-sm hover:bg-cyber-yellow hover:text-cyber-black transition-all flex items-center justify-center gap-2 group"
                                        >
                                            DEPLOY_CONTRACT
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </>
                                )}

                                {wizardStep === 'deploying' && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="w-12 h-12 border-4 border-cyber-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-cyber-yellow font-mono animate-pulse">DEPLOYING_CONTRACT...</p>
                                        <p className="text-xs text-gray-500 mt-2 font-mono">Simulating Block Confirmations</p>
                                    </div>
                                )}

                                {wizardStep === 'success' && (
                                    <div className="text-center space-y-4">
                                        <div className="bg-green-900/20 border border-green-500/50 p-4 rounded">
                                            <p className="text-green-400 font-mono text-sm mb-2">CONTRACT_DEPLOYED</p>
                                            <p className="text-xs text-gray-400 break-all font-mono">{deployedContract}</p>
                                        </div>
                                        <p className="text-sm text-gray-300">
                                            Contract is ready. Mint your admin NFT to initialize the group.
                                        </p>
                                        <button
                                            onClick={handleMintAndCreate}
                                            className="w-full bg-cyber-yellow text-cyber-black py-3 font-mono text-sm hover:bg-white transition-all flex items-center justify-center gap-2 font-bold"
                                        >
                                            MINT_ADMIN_NFT & CREATE
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Join Group Form */}
                        {mode === 'join_group' && (
                            <form onSubmit={handleJoinGroup} className="space-y-4">
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
                                <button
                                    type="submit"
                                    className="w-full bg-cyber-gray border border-cyber-yellow text-cyber-yellow py-3 font-mono text-sm hover:bg-cyber-yellow hover:text-cyber-black transition-all flex items-center justify-center gap-2 group"
                                >
                                    VERIFY_AND_JOIN
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
