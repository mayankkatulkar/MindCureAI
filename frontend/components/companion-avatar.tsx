'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useVoiceAssistant } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// Avatar character types
export type AvatarCharacter = 'luna' | 'kai' | 'coco' | 'mochi';

interface CompanionAvatarProps {
    character?: AvatarCharacter;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showStatus?: boolean;
    showName?: boolean;
}

// Character configurations
const characters: Record<AvatarCharacter, {
    name: string;
    colors: { primary: string; secondary: string; accent: string; glow: string };
    emoji: string;
    description: string;
}> = {
    luna: {
        name: 'Luna',
        colors: {
            primary: '#e879f9',
            secondary: '#f0abfc',
            accent: '#fdf4ff',
            glow: 'rgba(232, 121, 249, 0.3)'
        },
        emoji: '🌙',
        description: 'Gentle and calming companion'
    },
    kai: {
        name: 'Kai',
        colors: {
            primary: '#60a5fa',
            secondary: '#93c5fd',
            accent: '#eff6ff',
            glow: 'rgba(96, 165, 250, 0.3)'
        },
        emoji: '🌊',
        description: 'Supportive and grounding friend'
    },
    coco: {
        name: 'Coco',
        colors: {
            primary: '#fb923c',
            secondary: '#fdba74',
            accent: '#fff7ed',
            glow: 'rgba(251, 146, 60, 0.3)'
        },
        emoji: '🧡',
        description: 'Warm and encouraging buddy'
    },
    mochi: {
        name: 'Mochi',
        colors: {
            primary: '#a78bfa',
            secondary: '#c4b5fd',
            accent: '#f5f3ff',
            glow: 'rgba(167, 139, 250, 0.3)'
        },
        emoji: '✨',
        description: 'Playful and uplifting companion'
    }
};

export const CompanionAvatar = ({
    character = 'luna',
    className,
    size = 'lg',
    showStatus = true,
    showName = true
}: CompanionAvatarProps) => {
    const { state: agentState } = useVoiceAssistant();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
    const [blinkState, setBlinkState] = useState(false);

    const config = characters[character];

    useEffect(() => {
        setIsSpeaking(agentState === 'speaking');
        setIsThinking(agentState === 'thinking');
    }, [agentState]);

    // Random eye movement
    useEffect(() => {
        const moveEyes = setInterval(() => {
            if (!isSpeaking) {
                setEyePosition({
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 2
                });
            }
        }, 2500);
        return () => clearInterval(moveEyes);
    }, [isSpeaking]);

    // Random blinking
    useEffect(() => {
        const blink = setInterval(() => {
            setBlinkState(true);
            setTimeout(() => setBlinkState(false), 150);
        }, 3500 + Math.random() * 2000);
        return () => clearInterval(blink);
    }, []);

    const sizeClasses = {
        sm: 'w-24 h-24',
        md: 'w-40 h-40',
        lg: 'w-64 h-64'
    };

    const eyeScale = size === 'sm' ? 0.5 : size === 'md' ? 0.75 : 1;

    // Get status text
    const getStatusText = () => {
        switch (agentState) {
            case 'speaking': return 'Talking to you...';
            case 'thinking': return 'Thinking...';
            case 'listening': return 'Listening...';
            case 'connecting': return 'Waking up...';
            default: return 'Here for you';
        }
    };

    return (
        <div className={cn("flex flex-col items-center gap-4", className)}>
            {/* Avatar Container */}
            <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>

                {/* Outer Glow */}
                <motion.div
                    className="absolute inset-0 rounded-full blur-2xl"
                    style={{ backgroundColor: config.colors.glow }}
                    animate={{
                        scale: isSpeaking ? [1, 1.3, 1] : [1, 1.1, 1],
                        opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: isSpeaking ? 0.8 : 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Main Body */}
                <motion.div
                    className="relative rounded-full shadow-2xl flex items-center justify-center overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${config.colors.secondary}, ${config.colors.primary})`,
                        width: '80%',
                        height: '80%'
                    }}
                    animate={{
                        scale: isSpeaking ? [1, 1.05, 0.98, 1.02, 1] : [1, 1.02, 1],
                        y: isSpeaking ? [0, -3, 0, -2, 0] : [0, -2, 0]
                    }}
                    transition={{
                        duration: isSpeaking ? 0.6 : 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Face Container */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">

                        {/* Eyes */}
                        <div
                            className="flex gap-6"
                            style={{
                                gap: `${24 * eyeScale}px`,
                                marginBottom: `${8 * eyeScale}px`
                            }}
                        >
                            {/* Left Eye */}
                            <motion.div
                                className="relative rounded-full bg-white shadow-inner flex items-center justify-center"
                                style={{
                                    width: `${28 * eyeScale}px`,
                                    height: blinkState ? `${4 * eyeScale}px` : `${32 * eyeScale}px`,
                                }}
                                animate={{
                                    x: eyePosition.x,
                                    y: eyePosition.y
                                }}
                            >
                                {!blinkState && (
                                    <motion.div
                                        className="rounded-full bg-gray-800"
                                        style={{
                                            width: `${14 * eyeScale}px`,
                                            height: `${14 * eyeScale}px`
                                        }}
                                        animate={{
                                            scale: isThinking ? [1, 0.8, 1] : 1,
                                            x: eyePosition.x * 0.5,
                                            y: eyePosition.y * 0.5
                                        }}
                                    >
                                        {/* Eye shine */}
                                        <div
                                            className="absolute rounded-full bg-white"
                                            style={{
                                                width: `${5 * eyeScale}px`,
                                                height: `${5 * eyeScale}px`,
                                                top: `${2 * eyeScale}px`,
                                                right: `${2 * eyeScale}px`
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Right Eye */}
                            <motion.div
                                className="relative rounded-full bg-white shadow-inner flex items-center justify-center"
                                style={{
                                    width: `${28 * eyeScale}px`,
                                    height: blinkState ? `${4 * eyeScale}px` : `${32 * eyeScale}px`,
                                }}
                                animate={{
                                    x: eyePosition.x,
                                    y: eyePosition.y
                                }}
                            >
                                {!blinkState && (
                                    <motion.div
                                        className="rounded-full bg-gray-800"
                                        style={{
                                            width: `${14 * eyeScale}px`,
                                            height: `${14 * eyeScale}px`
                                        }}
                                        animate={{
                                            scale: isThinking ? [1, 0.8, 1] : 1,
                                            x: eyePosition.x * 0.5,
                                            y: eyePosition.y * 0.5
                                        }}
                                    >
                                        {/* Eye shine */}
                                        <div
                                            className="absolute rounded-full bg-white"
                                            style={{
                                                width: `${5 * eyeScale}px`,
                                                height: `${5 * eyeScale}px`,
                                                top: `${2 * eyeScale}px`,
                                                right: `${2 * eyeScale}px`
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>

                        {/* Blush spots */}
                        <div className="flex justify-between absolute" style={{ bottom: '35%', width: '70%' }}>
                            <motion.div
                                className="rounded-full"
                                style={{
                                    width: `${12 * eyeScale}px`,
                                    height: `${6 * eyeScale}px`,
                                    backgroundColor: 'rgba(255, 182, 193, 0.6)'
                                }}
                                animate={{ opacity: isSpeaking ? [0.4, 0.7, 0.4] : 0.5 }}
                            />
                            <motion.div
                                className="rounded-full"
                                style={{
                                    width: `${12 * eyeScale}px`,
                                    height: `${6 * eyeScale}px`,
                                    backgroundColor: 'rgba(255, 182, 193, 0.6)'
                                }}
                                animate={{ opacity: isSpeaking ? [0.4, 0.7, 0.4] : 0.5 }}
                            />
                        </div>

                        {/* Mouth */}
                        <motion.div
                            style={{
                                width: `${isSpeaking ? 20 : 16}px`,
                                height: `${isSpeaking ? 14 : 8}px`,
                                marginTop: `${12 * eyeScale}px`,
                                backgroundColor: '#f472b6',
                                borderRadius: isSpeaking ? '8px 8px 12px 12px' : '4px 4px 12px 12px'
                            }}
                            animate={{
                                width: isSpeaking ? [16, 20, 14, 18, 16] : 16,
                                height: isSpeaking ? [8, 14, 10, 12, 8] : 8,
                                borderRadius: isSpeaking
                                    ? ['4px 4px 12px 12px', '8px 8px 16px 16px', '4px 4px 12px 12px']
                                    : '4px 4px 12px 12px'
                            }}
                            transition={{
                                duration: isSpeaking ? 0.3 : 0.5,
                                repeat: isSpeaking ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                        />
                    </div>

                    {/* Sparkles when speaking */}
                    <AnimatePresence>
                        {isSpeaking && (
                            <>
                                <motion.div
                                    className="absolute text-lg"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1, 0.5],
                                        x: [0, 15, 30],
                                        y: [0, -20, -40]
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    style={{ top: '20%', right: '10%' }}
                                >
                                    ✨
                                </motion.div>
                                <motion.div
                                    className="absolute text-sm"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1, 0.5],
                                        x: [0, -15, -30],
                                        y: [0, -15, -30]
                                    }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                                    style={{ top: '30%', left: '10%' }}
                                >
                                    ⭐
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Name Badge */}
            {showName && (
                <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                    style={{
                        background: `linear-gradient(135deg, ${config.colors.accent}, transparent)`,
                        border: `1px solid ${config.colors.secondary}50`
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span>{config.emoji}</span>
                    <span className="font-semibold" style={{ color: config.colors.primary }}>
                        {config.name}
                    </span>
                </motion.div>
            )}

            {/* Status */}
            {showStatus && (
                <motion.p
                    className="text-sm font-medium text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {getStatusText()}
                </motion.p>
            )}
        </div>
    );
};

// Avatar Selector for choosing companion
export const AvatarSelector = ({
    selected,
    onSelect
}: {
    selected: AvatarCharacter;
    onSelect: (char: AvatarCharacter) => void;
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {(Object.keys(characters) as AvatarCharacter[]).map((char) => {
                const config = characters[char];
                const isSelected = selected === char;

                return (
                    <motion.button
                        key={char}
                        onClick={() => onSelect(char)}
                        className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            isSelected
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div
                            className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center text-2xl"
                            style={{
                                background: `linear-gradient(135deg, ${config.colors.secondary}, ${config.colors.primary})`
                            }}
                        >
                            {config.emoji}
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {config.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {config.description}
                        </p>
                    </motion.button>
                );
            })}
        </div>
    );
};

export default CompanionAvatar;
