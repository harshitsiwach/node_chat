import React, { useState, useRef } from 'react';
import { Image, Mic, Square, Send } from 'lucide-react';
import { CommandParser } from '../services/commands/CommandParser';
import { CommandHandler } from '../services/commands/CommandHandler';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface TerminalInputProps {
  onSendMessage: (message: string, type: 'text' | 'image' | 'audio', mediaUrl?: string) => void;
}

export const TerminalInput = ({ onSendMessage }: TerminalInputProps) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Command Autocomplete State
  const [showCommandList, setShowCommandList] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const { activeChat, currentUser, addMessage } = useChatStore();
  const { addNotification } = useNotificationStore();

  const AVAILABLE_COMMANDS = [
    { command: '#market', description: 'Create prediction market (e.g. #market "Q" Yes No)', icon: '🔮' },
    { command: '#buy', description: 'Swap tokens (e.g. #buy ETH 0.1)', icon: '💸' },
    { command: '#flip', description: 'Coin flip duel (e.g. #flip 0.1)', icon: '🪙' },
    { command: '#poll', description: 'Create a poll (e.g. #poll Question|Opt1|Opt2)', icon: '📊' },
    { command: '#pin', description: 'Pin a message (e.g. #pin <msg_id>)', icon: '📌' },
    { command: '#send', description: 'Send crypto (e.g. #send <addr> <amt> <token>)', icon: '💸' },
    { command: '#tip', description: 'Tip user (e.g. #tip <amt> <token>)', icon: '💰' },
    { command: '#mute', description: 'Mute notifications', icon: '🔕' },
    { command: '#nft-check', description: 'Check NFT access for group', icon: '🛡️' },
  ];

  const filteredCommands = AVAILABLE_COMMANDS.filter(cmd => {
    const search = commandFilter.toLowerCase();
    const cmdName = cmd.command.toLowerCase(); // e.g. #market

    if (search.startsWith('/')) {
      // If user typed /market, match against #market
      return cmdName.replace('#', '').startsWith(search.replace('/', ''));
    }
    return cmdName.startsWith(search);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.startsWith('#') || value.startsWith('/')) {
      setShowCommandList(true);
      // Normalize filter to always compare against commands (which are stored with #)
      // If user typed /, we want to match against #command but ignore the prefix for filtering
      // We need to update how we filter. 
      // Instead of changing the filter here, let's just pass the raw value and handle it in the filter function
      setCommandFilter(value.split(' ')[0]);
      setSelectedIndex(0);
    } else {
      setShowCommandList(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    setInput(`${command} `);
    setShowCommandList(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check for command
    const command = CommandParser.parse(input);
    if (command && activeChat && currentUser) {
      const handled = await CommandHandler.handle(
        command,
        activeChat,
        currentUser.address,
        addMessage,
        addNotification
      );

      if (handled) {
        setInput('');
        setShowCommandList(false);
        return;
      }
    }

    // Normal message
    onSendMessage(input, 'text');
    setInput('');
    setShowCommandList(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommandList && filteredCommands.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleCommandSelect(filteredCommands[selectedIndex].command);
        return;
      }
      if (e.key === 'Escape') {
        setShowCommandList(false);
        return;
      }
    }

    if (e.key === 'Enter' && input.trim()) {
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage('Image uploaded', 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onSendMessage('Voice Message', 'audio', reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full">
      {/* Command Autocomplete List */}
      {showCommandList && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-cyber-black border border-cyber-yellow shadow-[0_0_15px_rgba(255,215,0,0.2)] overflow-hidden z-50">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.command}
              onClick={() => handleCommandSelect(cmd.command)}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 font-mono text-sm transition-colors ${index === selectedIndex
                ? 'bg-cyber-yellow text-cyber-black'
                : 'text-gray-300 hover:bg-gray-900'
                }`}
            >
              <span className="text-lg">{cmd.icon}</span>
              <div className="flex flex-col">
                <span className="font-bold">{cmd.command}</span>
                <span className={`text-xs ${index === selectedIndex ? 'text-cyber-black/70' : 'text-gray-500'}`}>
                  {cmd.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        className="flex items-center w-full h-full bg-cyber-black text-cyber-yellow font-mono text-sm cursor-text gap-2"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1 hover:bg-cyber-yellow hover:text-cyber-black transition-colors"
          title="Upload Image"
        >
          <Image className="w-4 h-4" />
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-1 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'hover:bg-cyber-yellow hover:text-cyber-black'}`}
          title={isRecording ? "Stop Recording" : "Record Audio"}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <span className="mr-2">{'>'}</span>

        {isRecording ? (
          <div className="flex-1 text-red-500 font-bold animate-pulse">
            [RECORDING {formatTime(recordingTime)}]
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              // Delay hiding to allow click event to fire
              setTimeout(() => setShowCommandList(false), 200);
            }}
            className="flex-1 bg-transparent border-none outline-none text-cyber-yellow placeholder-gray-600"
            autoFocus
            placeholder="Enter command (#poll, #send)..."
          />
        )}

        <span
          className={`w-2 h-4 bg-cyber-yellow ml-1 ${isFocused && !isRecording ? 'animate-pulse' : 'opacity-0'}`}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSend();
            inputRef.current?.focus();
          }}
          disabled={!input.trim()}
          className={`p-1 ml-2 transition-colors ${input.trim() ? 'text-cyber-yellow hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
