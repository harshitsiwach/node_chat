import { Hash, Users, Activity } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

export const ChatList = () => {
    const { chats, activeChat, setActiveChat, onlineUsers, currentUser } = useChatStore();

    const isOnline = (chat: any) => {
        if (chat.type === 'group') return true; // Groups always "online" for now
        if (chat.type === 'direct') {
            const otherParticipant = chat.participants.find((p: string) => p !== currentUser?.address);
            return otherParticipant && onlineUsers.includes(otherParticipant);
        }
        return false;
    };

    return (
        <div className="w-full md:w-64 border-r border-cyber-gray bg-cyber-black/95 flex flex-col z-10 h-full">
            <div className="p-4 border-b border-cyber-gray">
                <h2 className="text-cyber-yellow font-mono text-sm tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    ACTIVE_FEEDS
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat.id)}
                        className={`w-full text-left p-3 font-mono text-xs transition-all border ${activeChat === chat.id
                            ? 'bg-cyber-yellow/10 border-cyber-yellow text-cyber-yellow'
                            : 'border-transparent text-gray-400 hover:bg-cyber-gray hover:text-white'
                            } group relative`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-2 font-bold">
                                {chat.type === 'group' ? <Users className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                                {chat.name}
                            </span>
                            {isOnline(chat) && (
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" title="Online"></span>
                            )}
                            {chat.unreadCount > 0 && (
                                <span className="ml-auto bg-cyber-yellow text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {chat.unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                            <span className="truncate max-w-[120px]">{chat.lastMessage || 'No messages'}</span>
                            <span>{chat.lastMessageTime}</span>
                        </div>

                        {/* Hover glitch effect line */}
                        <div className="absolute bottom-0 left-0 h-[1px] bg-cyber-yellow w-0 group-hover:w-full transition-all duration-300"></div>
                    </button>
                ))}
            </div>

            <div className="p-2 text-[10px] text-gray-600 font-mono text-center border-t border-cyber-gray">
                ENCRYPTED_MESH_NET_V1.0
            </div>
        </div>
    );
};
