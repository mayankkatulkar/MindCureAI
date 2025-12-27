'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft, Calendar, Clock, Brain, Sparkles,
    Target, TrendingUp, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSession } from '@/lib/types';

interface SessionInsightsDashboardProps {
    session: ChatSession;
    onBack: () => void;
}

export function SessionInsightsDashboard({ session, onBack }: SessionInsightsDashboardProps) {
    const [showTranscript, setShowTranscript] = useState(false);

    // Local state for analysis data to allow seamless updates without reload
    const [localAnalysis, setLocalAnalysis] = useState<any>(null);

    // Use real analysis data from backend OR local state if just generated
    const analysis = localAnalysis || session.metadata?.analysis;
    const hasAnalysis = !!analysis;

    // Fallback display logic
    const displayAnalysis = analysis || {
        sentimentScore: 0,
        moodShift: { before: '?', after: '?' },
        keyInsights: ['No insights generated yet.'],
        subconsciousPatterns: [],
        actionItems: []
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="h-full w-full bg-background overflow-y-auto pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-primary/10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        {session.title || 'Session Insights'}
                    </h1>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.duration_seconds)}
                        </span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8">

                {/* Top Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mental Wellness Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border/50 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Brain className="h-24 w-24 text-primary" />
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Mental Wellness Score</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-bold text-primary">{displayAnalysis.sentimentScore}</span>
                            <span className="text-xl text-muted-foreground mb-1">/10</span>
                        </div>
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Top 20% this week
                        </p>
                    </motion.div>

                    {/* Mood Shift */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border/50 rounded-2xl p-6"
                    >
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Mood Shift</h3>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <div className="text-2xl mb-1">😐</div>
                                <div className="text-sm font-medium">{displayAnalysis.moodShift?.before || '?'}</div>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-muted to-primary mx-4 relative">
                                <div className="absolute right-0 -top-1 w-2 h-2 bg-primary rounded-full" />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl mb-1">😌</div>
                                <div className="text-sm font-medium">{displayAnalysis.moodShift?.after || '?'}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Focus */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border/50 rounded-2xl p-6"
                    >
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Focus</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {displayAnalysis.primaryFocus && displayAnalysis.primaryFocus.length > 0 ? (
                                displayAnalysis.primaryFocus.map((tag: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">Analysis needed</span>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Subconscious Patterns (New) */}
                {displayAnalysis.subconsciousPatterns && displayAnalysis.subconsciousPatterns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Brain className="h-32 w-32" />
                        </div>
                        <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Subconscious Patterns Identified
                        </h3>
                        <ul className="space-y-3">
                            {displayAnalysis.subconsciousPatterns.map((pattern: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                    <span className="text-foreground/90 italic">"{pattern}"</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* Key Insights & Action Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                            <h3 className="text-lg font-semibold">Key Breakthroughs</h3>
                        </div>
                        <ul className="space-y-4">
                            {(displayAnalysis.keyInsights || []).map((insight: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <span className="text-foreground/90">{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Action Plan</h3>
                        </div>
                        <ul className="space-y-4">
                            {displayAnalysis.actionItems && displayAnalysis.actionItems.length > 0 ? (
                                displayAnalysis.actionItems.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm bg-background/50 p-3 rounded-lg border border-primary/10">
                                        <input type="checkbox" className="mt-0.5" />
                                        <span className="text-foreground/90">{item}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-muted-foreground italic">
                                    No action items generated.
                                </li>
                            )}
                        </ul>
                    </motion.div>
                </div>

                {/* Refinement Section (Only visible if analysis exists) */}
                {hasAnalysis && (
                    <div className="bg-card border border-border/50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-2">Refine Your Plan</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Chat with the AI to adjust your action plan or focus on a specific area (e.g., "Focus on my career anxiety").
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="refine-input"
                                placeholder="E.g., Make this more actionable..."
                                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const btn = document.getElementById('refine-btn');
                                        if (btn) btn.click();
                                    }
                                }}
                            />
                            <Button
                                id="refine-btn"
                                onClick={async () => {
                                    const input = document.getElementById('refine-input') as HTMLInputElement;
                                    const btn = document.getElementById('refine-btn') as HTMLButtonElement;
                                    const prompt = input.value;

                                    if (!prompt.trim()) return;

                                    if (btn) {
                                        btn.disabled = true;
                                        btn.innerText = 'Refining...';
                                    }

                                    try {
                                        const apiKey = localStorage.getItem('gemini_api_key');

                                        const res = await fetch('/api/analysis', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                transcript: session.transcript,
                                                userApiKey: apiKey,
                                                moodBefore: session.mood_before,
                                                refinementInstruction: prompt
                                            })
                                        });

                                        if (!res.ok) throw new Error(await res.text());
                                        const analysisData = await res.json();

                                        await fetch('/api/chat-sessions', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                id: session.id,
                                                metadata: { ...session.metadata, analysis: analysisData }
                                            })
                                        });

                                        setLocalAnalysis(analysisData);
                                        input.value = '';

                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to refine analysis.');
                                    } finally {
                                        if (btn) {
                                            btn.disabled = false;
                                            btn.innerText = 'Refine';
                                        }
                                    }
                                }}
                            >
                                Refine
                            </Button>
                        </div>
                    </div>
                )}

                {/* On-Demand Analysis Button */}
                {!hasAnalysis && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Unlock Session Insights</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                                Generate a mental wellness score, mood analysis, and personalized action plan for this session using AI.
                            </p>
                        </div>
                        <Button
                            onClick={async () => {
                                const btn = document.getElementById('analyze-btn') as HTMLButtonElement;
                                if (btn) {
                                    btn.disabled = true;
                                    btn.innerText = 'Analyzing...';
                                }

                                try {
                                    // 1. Get API Key
                                    const apiKey = localStorage.getItem('gemini_api_key');

                                    // 2. Call Analysis API
                                    const res = await fetch('/api/analysis', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            transcript: session.transcript,
                                            userApiKey: apiKey,
                                            moodBefore: session.mood_before
                                        })
                                    });

                                    if (!res.ok) throw new Error(await res.text());
                                    const analysisData = await res.json();

                                    // 3. Save to Session (PATCH)
                                    await fetch('/api/chat-sessions', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            id: session.id,
                                            metadata: { ...session.metadata, analysis: analysisData }
                                        })
                                    });

                                    // Soft update (no reload)
                                    setLocalAnalysis(analysisData);

                                } catch (err) {
                                    console.error(err);
                                    alert('Failed to generate analysis. Please try again later.');
                                    if (btn) {
                                        btn.disabled = false;
                                        btn.innerText = 'Generate Analysis';
                                    }
                                }
                            }}
                            id="analyze-btn"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8"
                        >
                            Generate Analysis
                        </Button>
                    </div>
                )}

                {/* Transcript Section */}
                <div className="border border-border/50 rounded-2xl overflow-hidden bg-card/30">
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                    >
                        <span className="font-medium">Full Transcript</span>
                        {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <AnimatePresence>
                        {showTranscript && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 space-y-4 border-t border-border/50 bg-background/50">
                                    {(session.transcript as any[] || []).map((msg, idx) => {
                                        // Handle both LiveKit format (msg.from object) and clean DB format (msg.from string, msg.isLocal boolean)
                                        const isLocal = typeof msg.from === 'string'
                                            ? msg.isLocal
                                            : msg.from?.isLocal;
                                        const messageText = msg.message || '';

                                        return (
                                            <div key={msg.id || idx} className={cn("flex gap-3", isLocal ? "flex-row-reverse" : "")}>
                                                <div className={cn(
                                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                                    isLocal
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground"
                                                )}>
                                                    {messageText}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!session.transcript || (session.transcript as any[]).length === 0) && (
                                        <p className="text-center text-muted-foreground text-sm py-4">
                                            No transcript available for this session.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
