'use client';

import React, { useEffect, useState } from 'react';
import { useVoiceAssistant } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import './anime-avatar.css';

interface AnimeAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    showStatus?: boolean;
}

export default function AnimeAvatar({ size = 'lg', showStatus = true }: AnimeAvatarProps) {
    const { state: agentState } = useVoiceAssistant();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [blinkState, setBlinkState] = useState(false);

    useEffect(() => {
        setIsSpeaking(agentState === 'speaking');
        setIsThinking(agentState === 'thinking');
    }, [agentState]);

    // Random blinking
    useEffect(() => {
        const blink = setInterval(() => {
            setBlinkState(true);
            setTimeout(() => setBlinkState(false), 150);
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(blink);
    }, []);

    const sizeClasses = {
        sm: { container: 'w-48 h-64', face: 'scale-50' },
        md: { container: 'w-72 h-96', face: 'scale-75' },
        lg: { container: 'w-96 h-[500px]', face: 'scale-100' }
    };

    const getStatusText = () => {
        switch (agentState) {
            case 'speaking': return '💬 Speaking...';
            case 'thinking': return '🤔 Thinking...';
            case 'listening': return '👂 Listening...';
            case 'connecting': return '⏳ Connecting...';
            default: return '✨ Ready';
        }
    };

    return (
        <div className={`anime-avatar-container ${sizeClasses[size].container}`}>
            {/* Background glow */}
            <motion.div
                className="avatar-glow"
                animate={{
                    opacity: isSpeaking ? [0.4, 0.7, 0.4] : isThinking ? [0.3, 0.5, 0.3] : 0.3,
                    scale: isSpeaking ? [1, 1.1, 1] : 1
                }}
                transition={{
                    duration: isSpeaking ? 0.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Main avatar container */}
            <motion.div
                className="avatar-body"
                animate={{
                    y: isSpeaking ? [0, -5, 0] : [0, -3, 0]
                }}
                transition={{
                    duration: isSpeaking ? 0.3 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Hair back */}
                <div className="hair-back" />

                {/* Face */}
                <div className="face">
                    {/* Eyes */}
                    <div className="eyes">
                        {/* Left eye */}
                        <div className={`eye left ${blinkState ? 'blink' : ''}`}>
                            <div className="eye-white">
                                <motion.div
                                    className="iris"
                                    animate={{
                                        scale: isThinking ? [1, 0.9, 1] : 1
                                    }}
                                >
                                    <div className="pupil" />
                                    <div className="eye-shine" />
                                    <div className="eye-shine small" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Right eye */}
                        <div className={`eye right ${blinkState ? 'blink' : ''}`}>
                            <div className="eye-white">
                                <motion.div
                                    className="iris"
                                    animate={{
                                        scale: isThinking ? [1, 0.9, 1] : 1
                                    }}
                                >
                                    <div className="pupil" />
                                    <div className="eye-shine" />
                                    <div className="eye-shine small" />
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Eyebrows */}
                    <div className="eyebrows">
                        <div className={`eyebrow left ${isThinking ? 'raised' : ''}`} />
                        <div className={`eyebrow right ${isThinking ? 'raised' : ''}`} />
                    </div>

                    {/* Nose */}
                    <div className="nose" />

                    {/* Blush */}
                    <div className="blush left" />
                    <div className="blush right" />

                    {/* Mouth */}
                    <motion.div
                        className={`mouth ${isSpeaking ? 'speaking' : ''}`}
                        animate={{
                            scaleY: isSpeaking ? [1, 1.5, 0.8, 1.3, 1] : 1,
                            scaleX: isSpeaking ? [1, 0.9, 1.1, 0.95, 1] : 1
                        }}
                        transition={{
                            duration: 0.2,
                            repeat: isSpeaking ? Infinity : 0
                        }}
                    />
                </div>

                {/* Hair front */}
                <div className="hair-front">
                    <div className="bangs">
                        {[...Array(7)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="bang-strand"
                                style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
                                animate={{
                                    rotate: isSpeaking ? [-2, 2, -2] : 0
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.05,
                                    repeat: isSpeaking ? Infinity : 0
                                }}
                            />
                        ))}
                    </div>
                    <div className="side-hair left" />
                    <div className="side-hair right" />
                </div>

                {/* Sparkles when speaking */}
                <AnimatePresence>
                    {isSpeaking && (
                        <>
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="sparkle"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1, 0.5],
                                        x: [0, (i - 2) * 30],
                                        y: [0, -40 - i * 10]
                                    }}
                                    transition={{
                                        duration: 1,
                                        delay: i * 0.2,
                                        repeat: Infinity
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '20%',
                                        left: '50%'
                                    }}
                                >
                                    ✨
                                </motion.div>
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Status badge */}
            {showStatus && (
                <motion.div
                    className="avatar-status"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className={`status-dot ${agentState}`} />
                    <span className="status-text">{getStatusText()}</span>
                </motion.div>
            )}
        </div>
    );
}

export { AnimeAvatar };
