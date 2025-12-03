import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

export class NFTService {
    private client;

    constructor() {
        this.client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });
    }

    // Check if a wallet owns at least one token of the given contract
    // Supports ERC-721 and ERC-1155 (balanceOf)
    async checkOwnership(walletAddress: string, contractAddress: string, tokenId?: string): Promise<boolean> {
        try {
            const abi = parseAbi([
                'function balanceOf(address owner) view returns (uint256)',
                'function balanceOf(address account, uint256 id) view returns (uint256)'
            ]);

            // Try ERC-721 style first (balanceOf(owner))
            try {
                const balance = await this.client.readContract({
                    address: contractAddress as `0x${string}`,
                    abi: [abi[0]],
                    functionName: 'balanceOf',
                    args: [walletAddress as `0x${string}`]
                }) as bigint;

                if (balance > 0n) return true;
            } catch (e) {
                // Ignore, might be ERC-1155 or other error
            }

            // Try ERC-1155 style (balanceOf(account, id))
            if (tokenId) {
                try {
                    const balance = await this.client.readContract({
                        address: contractAddress as `0x${string}`,
                        abi: [abi[1]],
                        functionName: 'balanceOf',
                        args: [walletAddress as `0x${string}`, BigInt(tokenId)]
                    }) as bigint;

                    if (balance > 0n) return true;
                } catch (e) {
                    // Ignore
                }
            }

            return false;
        } catch (error) {
            console.error("NFT check failed:", error);
            return false;
        }
    }
}

export const nftService = new NFTService();
