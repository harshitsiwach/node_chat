import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';

const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertOctagon,
};

const colors = {
    info: 'text-cyber-yellow border-cyber-yellow',
    success: 'text-green-500 border-green-500',
    warning: 'text-orange-500 border-orange-500',
    error: 'text-red-500 border-red-500',
};

export const NotificationToast = () => {
    const { notifications, removeNotification } = useNotificationStore();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notification) => {
                    const Icon = icons[notification.type];
                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className={`pointer-events-auto min-w-[300px] bg-cyber-black border ${colors[notification.type]} p-3 shadow-lg relative group`}
                        >
                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-1 h-1 bg-white opacity-50"></div>
                            <div className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-50"></div>

                            <div className="flex items-start gap-3">
                                <Icon className={`w-5 h-5 ${colors[notification.type].split(' ')[0]}`} />
                                <div className="flex-1">
                                    <p className="font-mono text-sm text-white">{notification.message}</p>
                                </div>
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scanline effect overlay */}
                            <div className="absolute inset-0 bg-scanline opacity-5 pointer-events-none"></div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
