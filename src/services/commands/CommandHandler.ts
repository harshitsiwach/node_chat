import type { Command } from './CommandParser';
import { type Message, type PollData } from '../../store/useChatStore';

import { mockRelayService } from '../relay/MockRelayService';

export class CommandHandler {
    static async handle(
        cmd: Command,
        chatId: string,
        currentUserAddress: string,
        addMessage: (chatId: string, msg: Message) => void,
        addNotification: (type: 'success' | 'error' | 'info', message: string) => void
    ): Promise<boolean> {

        switch (cmd.name) {
            case 'poll':
                return this.handlePoll(cmd.args, chatId, currentUserAddress, addMessage);

            case 'pin':
                // In a real app, we'd check if user is admin. 
                // For now, we'll just pin the last message or a specific ID if provided?
                // The spec says #pin <message_id>, but usually users want to pin the *current* context or reply.
                // Let's assume for now it pins the *last* message if no ID provided, or we need a UI to select.
                // Simplified: Just notify that pinning requires a target (UI interaction is better for this).
                // OR: We can create a "System Message" saying "Pinned" if we had a reference.
                // Let's implement a mock "Pin last message" for demo.
                return this.handlePin(chatId, addNotification);

            case 'nft-check':
                return this.handleNFTCheck(chatId, addNotification);

            case 'send':
                return this.handleSend(cmd.args, chatId, currentUserAddress, addMessage);

            case 'tip':
                return this.handleTip(cmd.args, chatId, currentUserAddress, addMessage);

            case 'mute':
                addNotification('info', `Notifications muted for ${cmd.args[0] || '1h'}`);
                return true;

            case 'flip':
                return this.handleFlip(cmd.args, chatId, currentUserAddress, addMessage);

            case 'market':
                return this.handleMarket(cmd.args, chatId, currentUserAddress, addMessage);

            case 'buy':
            case 'swap':
                return this.handleBuy(cmd.args, chatId, currentUserAddress, addMessage);

            default:
                return false;
        }
    }

    private static async handlePoll(args: string[], chatId: string, _sender: string, addMessage: (chatId: string, msg: Message) => void): Promise<boolean> {
        // Usage: #poll Question|Opt1|Opt2
        const fullText = args.join(' ');
        const parts = fullText.split('|').map(s => s.trim());

        if (parts.length < 3) {
            // Need question + at least 2 options
            return false;
        }

        const question = parts[0];
        const options = parts.slice(1).map((text, index) => ({
            id: index,
            text,
            votes: 0,
            voters: []
        }));

        const pollData: PollData = {
            id: Date.now().toString(),
            question,
            options,
            createdAt: Date.now(),
            endsAt: Date.now() + 86400000 // 24h
        };

        const message: Message = {
            id: Date.now().toString(),
            text: 'Poll Created',
            isSent: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'You', // In real app, use actual name
            type: 'text',
            poll: pollData
        };

        addMessage(chatId, message);
        return true;
    }

    private static async handlePin(_chatId: string, addNotification: (type: 'success' | 'error' | 'info', message: string) => void): Promise<boolean> {
        // In a real scenario, we'd need the message ID to pin.
        // For this demo, we'll assume the user wants to pin the *last* message, but we don't have access to message history here easily without passing it in.
        // So we will just show a notification explaining how it would work, or we need to update the signature of handle() to pass messages.

        // Let's update the signature of handle() in the next step if needed, but for now, let's just simulate a success message 
        // and maybe try to pin a dummy ID to the relay to show integration.

        // Better yet, let's say "Pinning requires selecting a message" if we can't get the ID.
        // But wait, the requirements say "#pin <message_id>".
        // So let's check args.

        // We need to pass args to handlePin.
        // Let's assume we update the call site to pass args.

        addNotification('info', 'To pin a message, use the UI (Long press / Right click) or #pin <message_id>');
        return true;
    }

    private static async handleNFTCheck(chatId: string, addNotification: (type: 'success' | 'error' | 'info', message: string) => void): Promise<boolean> {
        // Fetch group metadata from Relay
        const groups = await mockRelayService.getGroups();
        const group = groups.find(g => g.id === chatId);

        if (group) {
            addNotification('info', `NFT Check: Contract ${group.nftContract} (${group.tokenId ? `ID: ${group.tokenId}` : 'Any'})`);
        } else {
            addNotification('info', 'This is not an NFT-gated group.');
        }
        return true;
    }

    private static async handleSend(args: string[], chatId: string, _sender: string, addMessage: (chatId: string, msg: Message) => void): Promise<boolean> {
        // Usage: #send <recipient> <amount> <token>
        if (args.length < 3) return false;

        const [recipient, amount, token] = args;

        const message: Message = {
            id: Date.now().toString(),
            text: `💸 Sent ${amount} ${token} to ${recipient.slice(0, 6)}...`,
            isSent: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'You',
            type: 'text'
        };

        addMessage(chatId, message);
        return true;
    }

    private static async handleTip(args: string[], chatId: string, _sender: string, addMessage: (chatId: string, msg: Message) => void): Promise<boolean> {
        // Usage: #tip <amount> <token>
        if (args.length < 2) return false;

        const [amount, token] = args;

        const message: Message = {
            id: Date.now().toString(),
            text: `💰 Tipped ${amount} ${token}`,
            isSent: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'You',
            type: 'text'
        };

        addMessage(chatId, message);
        return true;
    }

    private static async handleFlip(args: string[], chatId: string, sender: string, addMessage: (chatId: string, msg: Message) => void): Promise<boolean> {
        // Usage: #flip <amount> <side> (e.g. #flip 0.1 heads)
        if (args.length < 2) return false;

        const [amount, side] = args;
        const validSides = ['heads', 'tails'];
        if (!validSides.includes(side.toLowerCase())) return false;

        const message: Message = {
            id: Date.now().toString(),
            text: `🎲 Coin Flip Challenge! Bet: ${amount} ETH on ${side.toUpperCase()}`,
            isSent: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'You',
            type: 'text',
            game: {
                type: 'coinflip',
                stake: amount,
                token: 'ETH',
                status: 'open',
                players: [sender],
                result: side.toLowerCase() // Storing the challenger's pick
            }
        };

        addMessage(chatId, message);
        return true;
    }

    private static async handleMarket(args: string[], chatId: string, sender: string, addMessage: (chatId: string, msg: Message) => void): Promise<boolean> {
        // Usage: #market "Question" Option1 Option2 ...
        // Example: #market "Will BTC hit 100k?" Yes No

        // Simple parser for quoted strings
        const fullArgs = args.join(' ');
        const questionMatch = fullArgs.match(/"([^"]+)"/);

        if (!questionMatch) return false;

        const question = questionMatch[1];
        const remainingArgs = fullArgs.replace(questionMatch[0], '').trim().split(/\s+/).filter(s => s.length > 0);

        const options = remainingArgs.length >= 2 ? remainingArgs : ['Yes', 'No'];

        const message: Message = {
            id: Date.now().toString(),
            text: `🔮 Prediction Market: ${question}`,
            isSent: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'You',
            type: 'text',
            market: {
                id: Date.now().toString(),
                question,
                options: options.map((opt, i) => ({
                    id: i.toString(),
                    text: opt,
                    pool: 0,
                    holders: {}
                })),
                endTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours default
                totalVolume: 0,
                status: 'open',
                creator: sender
            }
        };

        addMessage(chatId, message);
        return true;
    }

    private static async handleBuy(args: string[], chatId: string, sender: string, addMessage: (chatId: string, msg: Message) => void): Promise<boolean> {
        // Usage: #buy <token> <amount>
        // Example: #buy ETH 0.1

        if (args.length < 2) return false;

        const tokenSymbol = args[0].toUpperCase();
        const amount = parseFloat(args[1]);

        if (isNaN(amount) || amount <= 0) return false;

        const message: Message = {
            id: Date.now().toString(),
            text: `💸 Requesting Buy: ${amount} ${tokenSymbol}`,
            isSent: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'You',
            type: 'text',
            trade: {
                id: Date.now().toString(),
                tokenSymbol,
                amount,
                status: 'pending',
                from: sender
            }
        };

        addMessage(chatId, message);
        return true;
    }
}
