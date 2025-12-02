import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Globe, Bluetooth, Wifi } from 'lucide-react';

interface WelcomeModalProps {
    onClose: () => void;
}

export const WelcomeModal = ({ onClose }: WelcomeModalProps) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: Terminal,
            title: "INITIALIZING_PROTOCOL",
            desc: "Welcome to NODE Chat. A decentralized, secure communication terminal for the modern web."
        },
        {
            icon: Shield,
            title: "ZERO_KNOWLEDGE",
            desc: "No servers. No logs. Your identity is cryptographically generated and ephemeral."
        },
        {
            icon: Wifi,
            title: "LOCAL_WIFI_CHAT",
            desc: "High-speed local network chat. Connect with peers on the same Wi-Fi network for group messaging."
        },
        {
            icon: Bluetooth,
            title: "MESH_NETWORK",
            desc: "Offline capabilities enabled. Connect with nearby peers via Bluetooth Mesh when the grid goes down."
        },
        {
            icon: Globe,
            title: "READY_TO_CONNECT",
            desc: "System checks complete. Uplink established. You may now begin transmission."
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    // The useEffect for auto-advancing steps is removed as per the instruction's implied change
    // and the introduction of handleNext for manual progression.

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-cyber-black border border-cyber-yellow p-8 relative shadow-[0_0_50px_rgba(255,215,0,0.1)]"
            >
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-yellow"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-yellow"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-yellow"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-yellow"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-mono text-cyber-yellow mb-2 tracking-widest glitch-text">
                        ANON_CHAT
                    </h1>
                    <div className="h-[1px] w-24 bg-cyber-yellow mx-auto"></div>
                </div>

                <div className="space-y-6 mb-8">
                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: step >= i ? 1 : 0.3, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className={`p-2 border ${step >= i ? 'border-cyber-yellow text-cyber-yellow' : 'border-gray-800 text-gray-800'}`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-mono text-sm font-bold ${step >= i ? 'text-white' : 'text-gray-600'}`}>
                                    {s.title}
                                </h3>
                                <p className="text-xs text-gray-500 font-mono">{s.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full px-6 py-2 font-mono font-bold transition-colors
                        bg-cyber-yellow text-black hover:bg-white"
                >
                    {step < steps.length - 1 ? 'START' : 'ENTER_SYSTEM >'}
                </button>
            </motion.div>
        </div>
    );
};
