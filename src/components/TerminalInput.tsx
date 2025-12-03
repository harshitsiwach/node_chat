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
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const { activeChat, currentUser, addMessage } = useChatStore();
  const { addNotification } = useNotificationStore();

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
        return;
      }
    }

    // Normal message
    onSendMessage(input, 'text');
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
  );
};
