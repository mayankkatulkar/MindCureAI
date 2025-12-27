'use client';

import { useState, useEffect } from 'react';
import { SpeakerHigh, SmileyWink } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

// Gemini Live available voices
export const GEMINI_VOICES = [
    { id: 'Kore', name: 'Kore', description: 'Warm & feminine' },
    { id: 'Aoede', name: 'Aoede', description: 'Bright & clear' },
    { id: 'Charon', name: 'Charon', description: 'Deep & calm' },
    { id: 'Fenrir', name: 'Fenrir', description: 'Strong & confident' },
    { id: 'Puck', name: 'Puck', description: 'Playful & energetic' },
] as const;

export type GeminiVoice = typeof GEMINI_VOICES[number]['id'];

const VOICE_STORAGE_KEY = 'mindcure-voice';
const GENZ_STORAGE_KEY = 'genz-mode';

interface VoiceSettingsProps {
    className?: string;
    onVoiceChange?: (voice: GeminiVoice) => void;
    onGenZModeChange?: (isGenZ: boolean) => void;
    compact?: boolean;
}

export function VoiceSettings({
    className,
    onVoiceChange,
    onGenZModeChange,
    compact = false,
}: VoiceSettingsProps) {
    const [selectedVoice, setSelectedVoice] = useState<GeminiVoice>('Kore');
    const [isGenZMode, setIsGenZMode] = useState(false);

    useEffect(() => {
        // Load saved preferences
        const savedVoice = localStorage.getItem(VOICE_STORAGE_KEY) as GeminiVoice;
        const savedGenZ = localStorage.getItem(GENZ_STORAGE_KEY) === 'true';

        if (savedVoice && GEMINI_VOICES.some(v => v.id === savedVoice)) {
            setSelectedVoice(savedVoice);
            onVoiceChange?.(savedVoice);
        }

        setIsGenZMode(savedGenZ);
        onGenZModeChange?.(savedGenZ);
    }, [onVoiceChange, onGenZModeChange]);

    const handleVoiceChange = (voice: GeminiVoice) => {
        localStorage.setItem(VOICE_STORAGE_KEY, voice);
        setSelectedVoice(voice);
        onVoiceChange?.(voice);
    };

    const handleGenZToggle = () => {
        const newValue = !isGenZMode;
        localStorage.setItem(GENZ_STORAGE_KEY, newValue.toString());
        setIsGenZMode(newValue);
        onGenZModeChange?.(newValue);
    };

    if (compact) {
        return (
            <div className={cn('flex items-center gap-3', className)}>
                {/* Voice selector */}
                <div className="relative">
                    <select
                        value={selectedVoice}
                        onChange={(e) => handleVoiceChange(e.target.value as GeminiVoice)}
                        className="appearance-none bg-background/50 border border-border/50 rounded-lg px-3 py-1.5 pr-8 text-sm cursor-pointer hover:bg-background/80 transition-colors"
                    >
                        {GEMINI_VOICES.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                    <SpeakerHigh
                        size={14}
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                    />
                </div>

                {/* Gen Z mode toggle */}
                <button
                    type="button"
                    onClick={handleGenZToggle}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all',
                        isGenZMode
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300'
                            : 'bg-background/50 border-border/50 hover:bg-background/80'
                    )}
                    title={isGenZMode ? 'Gen Z Mode: ON' : 'Gen Z Mode: OFF'}
                >
                    <SmileyWink size={16} weight={isGenZMode ? 'fill' : 'regular'} />
                    <span className="hidden sm:inline">{isGenZMode ? 'Gen Z 🔥' : 'Classic'}</span>
                </button>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Voice Selection */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                    <SpeakerHigh size={16} />
                    AI Voice
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GEMINI_VOICES.map((voice) => (
                        <button
                            key={voice.id}
                            type="button"
                            onClick={() => handleVoiceChange(voice.id)}
                            className={cn(
                                'px-3 py-2 rounded-lg border text-sm transition-all text-left',
                                selectedVoice === voice.id
                                    ? 'bg-primary/20 border-primary/50 text-primary'
                                    : 'bg-background/50 border-border/50 hover:bg-background/80'
                            )}
                        >
                            <span className="font-medium">{voice.name}</span>
                            <span className="block text-xs opacity-60">{voice.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Gen Z Mode Toggle */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                    <SmileyWink size={16} />
                    Communication Style
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (isGenZMode) handleGenZToggle();
                        }}
                        className={cn(
                            'flex-1 px-4 py-3 rounded-lg border text-sm transition-all',
                            !isGenZMode
                                ? 'bg-primary/20 border-primary/50'
                                : 'bg-background/50 border-border/50 hover:bg-background/80'
                        )}
                    >
                        <span className="font-medium">Professional</span>
                        <span className="block text-xs opacity-60 mt-0.5">Calm & therapeutic</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isGenZMode) handleGenZToggle();
                        }}
                        className={cn(
                            'flex-1 px-4 py-3 rounded-lg border text-sm transition-all',
                            isGenZMode
                                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50'
                                : 'bg-background/50 border-border/50 hover:bg-background/80'
                        )}
                    >
                        <span className="font-medium">Gen Z Mode 🔥</span>
                        <span className="block text-xs opacity-60 mt-0.5">Fun & relatable</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Export helper to get current settings
export function getVoiceSettings(): { voice: GeminiVoice; genZMode: boolean } {
    if (typeof window === 'undefined') {
        return { voice: 'Kore', genZMode: false };
    }

    const voice = (localStorage.getItem(VOICE_STORAGE_KEY) as GeminiVoice) || 'Kore';
    const genZMode = localStorage.getItem(GENZ_STORAGE_KEY) === 'true';

    return { voice, genZMode };
}
