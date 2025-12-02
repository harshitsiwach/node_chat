import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Lock } from 'lucide-react';

interface WelcomeModalProps {
    onClose: () => void;
}

export const WelcomeModal = ({ onClose }: WelcomeModalProps) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: Terminal,
            title: 'SYSTEM_INITIALIZED',
            desc: 'Welcome to the encrypted mesh network. Your connection is secure.',
        },
        {
            icon: Shield,
            title: 'ANONYMITY_PROTOCOL',
            desc: 'Identity masked. Communication encrypted. No logs retained.',
        },
        {
            icon: Lock,
            title: 'SECURE_CHANNEL',
            desc: 'End-to-end encryption active. You are ready to transmit.',
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);
        return () => clearInterval(timer);
    }, []);

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
                    onClick={onClose}
                    disabled={step < steps.length - 1}
                    className={`w-full py-4 font-mono text-sm tracking-widest transition-all border ${step < steps.length - 1
                        ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                        : 'border-cyber-yellow text-cyber-black bg-cyber-yellow hover:bg-white hover:border-white'
                        }`}
                >
                    {step < steps.length - 1 ? 'INITIALIZING...' : 'ENTER_SYSTEM >'}
                </button>
            </motion.div>
        </div>
    );
};
