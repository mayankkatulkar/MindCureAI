'use client';

import React, { useEffect, useState } from 'react';
import { useVoiceAssistant } from '@livekit/components-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export const CozyAvatar = ({ className }: { className?: string }) => {
    const { state: agentState } = useVoiceAssistant();
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        setIsSpeaking(agentState === 'speaking');
    }, [agentState]);

    // Premium gradient colors for different states
    const getGradient = () => {
        switch (agentState) {
            case 'speaking':
                return 'from-fuchsia-500 via-pink-400 to-rose-300';
            case 'thinking':
                return 'from-violet-500 via-purple-400 to-indigo-300';
            case 'listening':
                return 'from-emerald-400 via-teal-300 to-cyan-200';
            default:
                return 'from-indigo-400 via-purple-300 to-pink-300';
        }
    };

    const getStatusInfo = () => {
        switch (agentState) {
            case 'speaking': return { text: 'Speaking', icon: '💬' };
            case 'thinking': return { text: 'Thinking', icon: '✨' };
            case 'listening': return { text: 'Listening', icon: '👂' };
            case 'connecting': return { text: 'Connecting', icon: '⏳' };
            default: return { text: 'Ready', icon: '🌟' };
        }
    };

    const status = getStatusInfo();

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)}>
            {/* Outermost Aura - Very Soft Glow */}
            <motion.div
                className="absolute w-[120%] h-[120%] rounded-full opacity-30"
                style={{
                    background: `radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)`,
                    filter: 'blur(40px)'
                }}
                animate={{
                    scale: isSpeaking ? [1, 1.15, 1] : [1, 1.05, 1],
                    opacity: isSpeaking ? [0.4, 0.6, 0.4] : 0.3
                }}
                transition={{
                    duration: isSpeaking ? 0.8 : 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Secondary Glow Ring */}
            <motion.div
                className={cn(
                    "absolute w-[110%] h-[110%] rounded-full blur-2xl opacity-40 bg-gradient-to-tr",
                    getGradient()
                )}
                animate={{
                    scale: isSpeaking ? [1, 1.1, 1] : [1, 1.03, 1],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    scale: { duration: isSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
            />

            {/* Main Premium Bubble - Perfectly Round */}
            <motion.div
                className={cn(
                    "relative w-full h-full rounded-full shadow-2xl bg-gradient-to-br overflow-hidden",
                    getGradient()
                )}
                style={{
                    boxShadow: `
                        0 0 60px rgba(167,139,250,0.3),
                        0 20px 60px rgba(0,0,0,0.15),
                        inset 0 -20px 60px rgba(0,0,0,0.1),
                        inset 0 20px 40px rgba(255,255,255,0.2)
                    `
                }}
                animate={{
                    scale: isSpeaking ? [1, 1.05, 1] : [1, 1.02, 1],
                    y: isSpeaking ? [0, -5, 0] : [0, -10, 0],
                }}
                transition={{
                    scale: { duration: isSpeaking ? 0.3 : 2, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: isSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }
                }}
            >
                {/* Inner Shine Effect */}
                <motion.div
                    className="absolute top-[10%] left-[15%] w-[30%] h-[30%] rounded-full bg-white/30 blur-xl"
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Secondary Highlight */}
                <motion.div
                    className="absolute top-[20%] left-[25%] w-[15%] h-[15%] rounded-full bg-white/50 blur-sm"
                />

                {/* Floating Inner Orbs (Subtle) */}
                <motion.div
                    className="absolute w-[20%] h-[20%] rounded-full bg-white/10"
                    animate={{
                        x: [0, 20, 0, -20, 0],
                        y: [0, -15, 0, 15, 0],
                        scale: [1, 1.2, 1, 0.9, 1]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ top: '40%', left: '40%' }}
                />

                {/* Pulse Center (Speaking Effect) */}
                {isSpeaking && (
                    <motion.div
                        className="absolute inset-[30%] rounded-full bg-white/20"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0, 0.3]
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity
                        }}
                    />
                )}
            </motion.div>

            {/* Premium Status Badge */}
            <motion.div
                className="absolute -bottom-16 flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(167,139,250,0.2)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.span
                    className="text-lg"
                    animate={{
                        scale: isSpeaking ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
                >
                    {status.icon}
                </motion.span>
                <span className="text-sm font-semibold text-gray-700">
                    {status.text}
                </span>
            </motion.div>
        </div>
    );
};
