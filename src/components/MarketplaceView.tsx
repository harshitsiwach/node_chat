import { useMarketplaceStore } from '../store/useMarketplaceStore';
import { ShoppingCart, Users, X } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface MarketplaceViewProps {
    onClose: () => void;
}

export const MarketplaceView = ({ onClose }: MarketplaceViewProps) => {
    const { listings } = useMarketplaceStore();
    const { createGroupChat } = useChatStore();
    const { addNotification } = useNotificationStore();

    const handleBuy = (listing: any) => {
        // Mock Purchase Logic
        addNotification('info', `Processing purchase for ${listing.name}...`);

        setTimeout(() => {
            addNotification('success', `Successfully purchased access to ${listing.name}!`);

            // Create the group locally for the user
            createGroupChat(listing.name, [listing.owner], {
                ownerWallet: listing.owner,
                groupKey: 'purchased_key',
                nftContract: 'mock_contract',
                tokenId: listing.id
            });

            onClose();
        }, 1500);
    };

    return (
        <div className="absolute inset-0 z-40 bg-cyber-black flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-cyber-yellow" />
                    <h2 className="text-xl font-mono text-white tracking-wider">NFT_MARKETPLACE</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Header (Mock) */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                            <div className="text-xl font-mono text-white">$4.2M <span className="text-green-500 text-xs">+12%</span></div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Total TVL</div>
                            <div className="text-xl font-mono text-white">$128M <span className="text-red-500 text-xs">-2%</span></div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Active Traders</div>
                            <div className="text-xl font-mono text-white">1,240 <span className="text-green-500 text-xs">+5%</span></div>
                        </div>
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Floor Sweep</div>
                            <div className="text-xl font-mono text-white">24 ETH</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-xs font-mono text-gray-400 uppercase tracking-wider">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-5">Collection</div>
                            <div className="col-span-2 text-right">Floor Price</div>
                            <div className="col-span-2 text-right">Volume</div>
                            <div className="col-span-2 text-right">Action</div>
                        </div>

                        <div className="divide-y divide-gray-800">
                            {listings.map((listing, index) => (
                                <div
                                    key={listing.id}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                                >
                                    <div className="col-span-1 text-center font-mono text-gray-500">{index + 1}</div>
                                    <div className="col-span-5 flex items-center gap-4">
                                        <img
                                            src={listing.imageUrl}
                                            alt={listing.name}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <div>
                                            <div className="font-bold text-white group-hover:text-cyber-yellow transition-colors">{listing.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <Users className="w-3 h-3" /> {listing.members} Members
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-white">
                                        {listing.price} ETH
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-gray-400">
                                        {(parseFloat(listing.price) * 142).toFixed(2)} ETH
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <button
                                            onClick={() => handleBuy(listing)}
                                            className="px-4 py-2 bg-cyber-yellow/10 border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow hover:text-black transition-all text-xs font-bold rounded"
                                        >
                                            BUY
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
