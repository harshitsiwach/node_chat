import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Bluetooth, Pin } from 'lucide-react';
import { useChatStore, type PollData } from '../store/useChatStore';

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

export const MessageBubble = ({ id, text, isSent, timestamp, sender, type = 'text', mediaUrl, isMesh, reactions, replyTo, isPinned, poll, chatId }: MessageBubbleProps) => {
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

                {type === 'text' && !poll && <p className="font-mono text-sm whitespace-pre-wrap">{text}</p>}

                {poll && <PollView poll={poll} chatId={chatId} messageId={id} />}

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
