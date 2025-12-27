'use client';

import React, { useEffect, useState } from 'react';
import { useVoiceAssistant } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

interface PremiumAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    showStatus?: boolean;
}

export default function PremiumAvatar({ size = 'lg', showStatus = true }: PremiumAvatarProps) {
    const { state: agentState } = useVoiceAssistant();
    const [pulseIntensity, setPulseIntensity] = useState(0);

    // Size configurations
    const sizeConfig = {
        sm: { container: 200, image: 180 },
        md: { container: 300, image: 270 },
        lg: { container: 400, image: 360 }
    };

    const { container, image } = sizeConfig[size];

    // Pulse effect based on speaking
    useEffect(() => {
        if (agentState === 'speaking') {
            const interval = setInterval(() => {
                setPulseIntensity(Math.random() * 0.3 + 0.7);
            }, 150);
            return () => clearInterval(interval);
        } else {
            setPulseIntensity(0.5);
        }
    }, [agentState]);

    const getStatusInfo = () => {
        switch (agentState) {
            case 'speaking': return { text: 'Speaking...', icon: '💬', color: '#f472b6' };
            case 'thinking': return { text: 'Thinking...', icon: '🤔', color: '#a855f7' };
            case 'listening': return { text: 'Listening...', icon: '👂', color: '#34d399' };
            case 'connecting': return { text: 'Connecting...', icon: '⏳', color: '#fbbf24' };
            default: return { text: 'Ready', icon: '✨', color: '#8b5cf6' };
        }
    };

    const status = getStatusInfo();

    return (
        <div
            className="relative flex flex-col items-center justify-center"
            style={{ width: container, height: container + 60 }}
        >
            {/* Outer glow rings */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: container + 40,
                    height: container + 40,
                    background: `radial-gradient(circle, ${status.color}40 0%, transparent 70%)`,
                    filter: 'blur(20px)'
                }}
                animate={{
                    scale: agentState === 'speaking' ? [1, 1.1, 1] : [1, 1.03, 1],
                    opacity: agentState === 'speaking' ? [0.6, 0.9, 0.6] : 0.4
                }}
                transition={{
                    duration: agentState === 'speaking' ? 0.5 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Animated ring */}
            <motion.div
                className="absolute rounded-full border-2"
                style={{
                    width: container + 20,
                    height: container + 20,
                    borderColor: status.color,
                }}
                animate={{
                    scale: agentState === 'speaking' ? [1, 1.05, 1] : 1,
                    opacity: agentState === 'speaking' ? [0.8, 1, 0.8] : 0.3,
                    rotate: [0, 360]
                }}
                transition={{
                    scale: { duration: 0.3, repeat: Infinity },
                    opacity: { duration: 0.3, repeat: Infinity },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
            />

            {/* Main avatar container */}
            <motion.div
                className="relative rounded-full overflow-hidden"
                style={{
                    width: image,
                    height: image,
                    boxShadow: `0 0 ${agentState === 'speaking' ? 40 : 20}px ${status.color}60, 
                      0 20px 60px rgba(0,0,0,0.3),
                      inset 0 0 30px rgba(255,255,255,0.1)`
                }}
                animate={{
                    y: agentState === 'speaking' ? [-2, 2, -2] : [0, -5, 0],
                    scale: agentState === 'speaking' ? [1, 1.02, 1] : 1
                }}
                transition={{
                    y: { duration: agentState === 'speaking' ? 0.3 : 3, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.3, repeat: Infinity }
                }}
            >
                {/* Gradient overlay for premium feel */}
                <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.2) 100%)'
                    }}
                />

                {/* Avatar image */}
                <Image
                    src="/avatars/sarah-avatar.png"
                    alt="Dr. Sarah - AI Therapist"
                    width={image}
                    height={image}
                    className="object-cover"
                    priority
                />

                {/* Speaking indicator overlay */}
                <AnimatePresence>
                    {agentState === 'speaking' && (
                        <motion.div
                            className="absolute inset-0 z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: pulseIntensity * 0.15 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: `radial-gradient(circle at 50% 80%, ${status.color} 0%, transparent 50%)`
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Sparkle effects when speaking */}
            <AnimatePresence>
                {agentState === 'speaking' && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-xl pointer-events-none"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1, 0.5],
                                    x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 15)],
                                    y: [-image / 3, -image / 2 - i * 20]
                                }}
                                transition={{
                                    duration: 1.5,
                                    delay: i * 0.2,
                                    repeat: Infinity
                                }}
                                style={{ top: '40%', left: '50%' }}
                            >
                                ✨
                            </motion.div>
                        ))}
                    </>
                )}
            </AnimatePresence>

            {/* Status badge */}
            {showStatus && (
                <motion.div
                    className="absolute flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                        bottom: 0,
                        background: 'rgba(15, 15, 30, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${status.color}50`,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${status.color}20`
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <motion.span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                        animate={{
                            scale: agentState === 'speaking' || agentState === 'thinking' ? [1, 1.3, 1] : 1,
                            opacity: agentState === 'speaking' || agentState === 'thinking' ? [1, 0.6, 1] : 1
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-medium text-white">
                        {status.icon} {status.text}
                    </span>
                </motion.div>
            )}
        </div>
    );
}

export { PremiumAvatar };
