import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Bluetooth } from 'lucide-react';

interface MessageBubbleProps {
    text: string;
    isSent: boolean;
    timestamp: string;
    sender: string;
    type: 'text' | 'image' | 'audio';
    mediaUrl?: string;
    isMesh?: boolean;
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

export const MessageBubble = ({ text, isSent, timestamp, sender, type = 'text', mediaUrl, isMesh }: MessageBubbleProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: isSent ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col mb-4 ${isSent ? 'items-end' : 'items-start'}`}
        >
            <div className="flex items-baseline mb-1">
                <span className={`text-[10px] font-mono mr-2 ${isSent ? 'text-cyber-yellow' : 'text-cyber-amber'}`}>
                    {sender}
                </span>
                <div className="flex items-center justify-between mt-1 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-50 font-mono">{timestamp}</span>
                        {isMesh && (
                            <span className="text-[9px] font-mono text-blue-400 flex items-center gap-0.5">
                                <Bluetooth className="w-2 h-2" />
                                MESH
                            </span>
                        )}
                    </div>
                    {isSent && (
                        <span className="text-[10px] font-mono text-cyber-yellow">SENT</span>
                    )}
                </div>
            </div>

            <div
                className={`max-w-[80%] p-3 border ${isSent
                    ? 'bg-cyber-yellow text-cyber-black border-cyber-yellow'
                    : 'bg-cyber-gray text-white border-cyber-yellow'
                    } relative group`}
            >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-white opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-50"></div>

                {type === 'text' && <p className="font-mono text-sm whitespace-pre-wrap">{text}</p>}

                {type === 'image' && mediaUrl && (
                    <div className="relative">
                        <img src={mediaUrl} alt="Encrypted Media" className="max-w-full h-auto border border-black/20" />
                        <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1">IMG_DATA</div>
                    </div>
                )}

                {type === 'audio' && mediaUrl && (
                    <AudioPlayer src={mediaUrl} />
                )}
            </div>
        </motion.div>
    );
};
