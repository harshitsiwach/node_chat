import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RefreshCw, User } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { currentUser, updateUserName } = useChatStore();
    const { addNotification } = useNotificationStore();
    const [username, setUsername] = useState(currentUser?.name || '');

    const handleSave = () => {
        if (!username.trim()) {
            addNotification('error', 'Username cannot be empty');
            return;
        }
        updateUserName(username);
        addNotification('success', 'Identity updated successfully');
        onClose();
    };

    const handleResetWelcome = () => {
        localStorage.removeItem('hasSeenWelcome');
        addNotification('info', 'Welcome screen reset. Reload to view.');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full max-w-md bg-cyber-black border border-gray-700 p-6 relative"
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h2 className="text-white font-mono text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-cyber-yellow" />
                                USER_CONFIGURATION
                            </h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-2">DISPLAY_NAME</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-700 text-white p-3 font-mono text-sm focus:border-cyber-yellow focus:outline-none transition-colors"
                                    placeholder="Enter new alias..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-2">SYSTEM_CONTROLS</label>
                                <button
                                    onClick={handleResetWelcome}
                                    className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-cyber-yellow transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    RESET_WELCOME_SEQUENCE
                                </button>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-cyber-gray border border-cyber-yellow text-cyber-yellow py-3 font-mono text-sm hover:bg-cyber-yellow hover:text-cyber-black transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                SAVE_CONFIGURATION
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
