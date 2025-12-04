import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Bluetooth, Pin } from 'lucide-react';
import { useChatStore, type PollData, type GameData } from '../store/useChatStore';

interface MessageBubbleProps {
    id: string;
    text: string;
    isSent: boolean;
    timestamp: string;
    sender: string;
    type: 'text' | 'image' | 'audio';
    mediaUrl?: string;
    isMesh?: boolean;
    reactions?: Record<string, string[]>;
    replyTo?: string;
    isPinned?: boolean;
    poll?: PollData;
    game?: GameData;
    market?: import('../store/useChatStore').PredictionMarketData;
    trade?: import('../store/useChatStore').TradeData;
    chatId: string;
}

const AudioPlayer = ({ src }: { src: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.onended = () => setIsPlaying(false);
        }
    }, []);

    return (
        <div className="flex items-center gap-2 min-w-[150px]">
            <audio ref={audioRef} src={src} className="hidden" />
            <button onClick={togglePlay} className="text-cyber-yellow hover:text-white">
                {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 h-1 bg-gray-700 overflow-hidden">
                {isPlaying && <div className="h-full bg-cyber-yellow w-full animate-pulse" />}
            </div>
            <span className="text-[10px] font-mono">VOICE_MSG</span>
        </div>
    );
};

const PollView = ({ poll, chatId, messageId }: { poll: PollData, chatId: string, messageId: string }) => {
    const { votePoll, currentUser } = useChatStore();
    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

    return (
        <div className="min-w-[200px] mt-2">
            <div className="font-bold mb-2 text-sm">{poll.question}</div>
            <div className="space-y-2">
                {poll.options.map(opt => {
                    const percent = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                    const isVoted = currentUser && opt.voters.includes(currentUser.address);

                    return (
                        <button
                            key={opt.id}
                            onClick={() => currentUser && votePoll(chatId, messageId, opt.id, currentUser.address)}
                            className={`w-full text-left relative p-2 border ${isVoted ? 'border-cyber-yellow bg-cyber-yellow/10' : 'border-gray-600 hover:bg-white/5'} transition-colors`}
                        >
                            <div className="absolute left-0 top-0 bottom-0 bg-cyber-yellow/20 transition-all duration-500" style={{ width: `${percent}%` }} />
                            <div className="relative flex justify-between text-xs font-mono z-10">
                                <span>{opt.text}</span>
                                <span>{opt.votes} ({Math.round(percent)}%)</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="text-[10px] mt-2 opacity-70 text-right">{totalVotes} votes • Ends {new Date(poll.endsAt).toLocaleDateString()}</div>
        </div>
    );
};

const PredictionMarketView = ({ market, chatId, messageId }: { market: import('../store/useChatStore').PredictionMarketData, chatId: string, messageId: string }) => {
    const { buyMarketOption, resolveMarket, currentUser } = useChatStore();
    const isCreator = currentUser && market.creator === currentUser.address;

    const handleBuy = (optionId: string) => {
        if (!currentUser) return;
        // Mock buy flow
        const amount = 0.1; // Fixed amount for demo
        if (confirm(`Buy "${market.options.find(o => o.id === optionId)?.text}" for ${amount} ETH?`)) {
            buyMarketOption(chatId, messageId, optionId, amount, currentUser.address);
        }
    };

    const handleResolve = (optionId: string) => {
        if (confirm(`Resolve market with "${market.options.find(o => o.id === optionId)?.text}" as winner? This cannot be undone.`)) {
            resolveMarket(chatId, messageId, optionId);
        }
    };

    return (
        <div className="min-w-[250px] mt-2 border-t border-white/20 pt-2">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-cyber-yellow">🔮 PREDICTION</span>
                <span className="text-xs opacity-70">Vol: {market.totalVolume.toFixed(2)} ETH</span>
            </div>
            <div className="font-bold mb-3 text-sm">{market.question}</div>

            <div className="space-y-2">
                {market.options.map(opt => {
                    const probability = market.totalVolume > 0 ? (opt.pool / market.totalVolume) * 100 : 0;
                    const isWinner = market.status === 'resolved' && market.winner === opt.id;

                    return (
                        <div key={opt.id} className={`relative border ${isWinner ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-black/20'} rounded p-2`}>
                            {/* Progress Bar */}
                            <div className="absolute left-0 top-0 bottom-0 bg-cyber-yellow/10 transition-all duration-500" style={{ width: `${probability}%` }} />

                            <div className="relative flex justify-between items-center z-10">
                                <div className="flex flex-col">
                                    <span className="font-mono text-xs font-bold">{opt.text}</span>
                                    <span className="text-[10px] opacity-60">{probability.toFixed(1)}% • {opt.pool.toFixed(2)} ETH</span>
                                </div>

                                {market.status === 'open' ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleBuy(opt.id)}
                                            className="px-2 py-1 bg-cyber-yellow text-black text-[10px] font-bold rounded hover:bg-white transition-colors"
                                        >
                                            BUY
                                        </button>
                                        {isCreator && (
                                            <button
                                                onClick={() => handleResolve(opt.id)}
                                                className="px-2 py-1 bg-gray-700 text-white text-[10px] font-bold rounded hover:bg-green-600 transition-colors"
                                                title="Resolve as Winner"
                                            >
                                                ✓
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    isWinner && <span className="text-green-400 text-xs font-bold">WINNER</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {market.status === 'resolved' && (
                <div className="mt-2 text-center text-[10px] opacity-50">Market Resolved</div>
            )}
        </div>
    );
};



const TradeView = ({ trade, chatId, messageId }: { trade: import('../store/useChatStore').TradeData, chatId: string, messageId: string }) => {
    const { executeTrade, currentUser } = useChatStore();
    const isOwner = currentUser && trade.from === currentUser.address;

    const handleConfirm = () => {
        if (!isOwner) return;
        if (confirm(`Confirm swap of ${trade.amount} ${trade.tokenSymbol}? Gas fees will apply.`)) {
            executeTrade(chatId, messageId);
        }
    };

    return (
        <div className="min-w-[200px] mt-2 border-t border-white/20 pt-2">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-green-400">💸 TOKEN SWAP</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${trade.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {trade.status.toUpperCase()}
                </span>
            </div>

            <div className="bg-black/30 p-3 rounded border border-gray-700 mb-2">
                <div className="text-xs text-gray-400 mb-1">BUYING</div>
                <div className="text-xl font-mono font-bold text-white">
                    {trade.amount} <span className="text-cyber-yellow">{trade.tokenSymbol}</span>
                </div>
            </div>

            {trade.status === 'pending' && isOwner && (
                <button
                    onClick={handleConfirm}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded transition-colors"
                >
                    CONFIRM TRANSACTION
                </button>
            )}

            {trade.status === 'completed' && (
                <div className="text-[10px] font-mono text-gray-500 break-all">
                    TX: {trade.txHash}
                </div>
            )}
        </div>
    );
};

const GameView = ({ game, chatId, messageId }: { game: GameData, chatId: string, messageId: string }) => {
    const { joinGame, currentUser } = useChatStore();
    const isParticipant = currentUser && game.players.includes(currentUser.address);
    const canJoin = !isParticipant && game.status === 'open';

    return (
        <div className="min-w-[200px] mt-2 border-t border-white/20 pt-2">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">🎲 {game.type.toUpperCase()}</span>
                <span className="text-xs bg-cyber-yellow/20 px-1.5 py-0.5 rounded text-cyber-yellow border border-cyber-yellow/50">
                    {game.stake} {game.token}
                </span>
            </div>

            {game.status === 'open' ? (
                <div className="flex flex-col gap-2">
                    <p className="text-xs opacity-80">Waiting for opponent...</p>
                    {canJoin && (
                        <button
                            onClick={() => currentUser && joinGame(chatId, messageId, currentUser.address)}
                            className="w-full py-1.5 bg-cyber-yellow text-black font-bold text-xs hover:bg-white transition-colors uppercase tracking-wider"
                        >
                            Accept Challenge
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1">
                        <span>Result:</span>
                        <span className="font-bold text-cyber-yellow">{game.result?.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span>Winner:</span>
                        <span className="font-mono">{game.winner?.slice(0, 6)}...</span>
                    </div>
                    {game.winner === currentUser?.address && (
                        <div className="text-center text-xs text-green-400 font-bold mt-1 animate-pulse">
                            YOU WON! +{Number(game.stake) * 2} {game.token}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const MessageBubble = ({ id, text, isSent, timestamp, sender, type = 'text', mediaUrl, isMesh, reactions, replyTo, isPinned, poll, game, market, trade, chatId }: MessageBubbleProps) => {
    const { addReaction, currentUser } = useChatStore();
    const [showReactions, setShowReactions] = useState(false);

    const handleReaction = (emoji: string) => {
        if (currentUser) {
            addReaction(chatId, id, emoji, currentUser.address);
            setShowReactions(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: isSent ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col mb-4 ${isSent ? 'items-end' : 'items-start'} relative group/msg`}
        >
            <div className="flex items-baseline mb-1 w-full justify-between">
                <span className={`text-[10px] font-mono mr-2 ${isSent ? 'text-cyber-yellow' : 'text-cyber-amber'}`}>
                    {sender}
                </span>
                <div className="flex items-center gap-2">
                    {isPinned && <Pin className="w-3 h-3 text-cyber-yellow rotate-45" />}
                    <span className="text-[10px] opacity-50 font-mono">{timestamp}</span>
                    {isMesh && (
                        <span className="text-[9px] font-mono text-blue-400 flex items-center gap-0.5">
                            <Bluetooth className="w-2 h-2" />
                            MESH
                        </span>
                    )}
                </div>
            </div>

            <div
                className={`max-w-[80%] p-3 border ${isSent
                    ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                    : 'bg-cyber-gray text-white border-cyber-yellow'
                    } relative group`}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
            >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-white opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-50"></div>

                {replyTo && (
                    <div className="mb-2 pl-2 border-l-2 border-white/30 text-xs opacity-70">
                        Replying to message...
                    </div>
                )}

                {type === 'text' && !poll && !game && <p className="font-mono text-sm whitespace-pre-wrap">{text}</p>}

                {poll && <PollView poll={poll} chatId={chatId} messageId={id} />}
                {game && <GameView game={game} chatId={chatId} messageId={id} />}
                {market && <PredictionMarketView market={market} chatId={chatId} messageId={id} />}
                {trade && <TradeView trade={trade} chatId={chatId} messageId={id} />}

                {type === 'image' && mediaUrl && (
                    <div className="relative">
                        <img src={mediaUrl} alt="Encrypted Media" className="max-w-full h-auto border border-black/20" />
                        <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1">IMG_DATA</div>
                    </div>
                )}

                {type === 'audio' && mediaUrl && (
                    <AudioPlayer src={mediaUrl} />
                )}

                {/* Reactions Display */}
                {reactions && Object.keys(reactions).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(reactions).map(([emoji, wallets]) => (
                            wallets.length > 0 && (
                                <div key={emoji} className="bg-black/20 px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-white/10">
                                    <span>{emoji}</span>
                                    <span>{wallets.length}</span>
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Reaction Picker (Hover) */}
                {showReactions && !isSent && (
                    <div className="absolute -top-8 left-0 bg-cyber-black border border-cyber-yellow p-1 flex gap-1 shadow-lg z-10">
                        {['👍', '❤️', '😂', '🔥', '🚀'].map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className="hover:bg-white/10 p-1 rounded transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
