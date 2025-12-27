'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, MessageCircle, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSession {
    id: string;
    title: string;
    summary?: string;
    voice_used: string;
    genz_mode: boolean;
    duration_seconds: number;
    mood_before?: string;
    mood_after?: string;
    created_at: string;
}

interface ChatHistoryProps {
    className?: string;
    onSessionSelect?: (session: ChatSession) => void;
    onNewSession?: () => void;
    currentSessionId?: string;
}

// ...

export function ChatHistory({
    className,
    onSessionSelect,
    onNewSession,
    currentSessionId,
}: ChatHistoryProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch('/api/chat-sessions');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Failed to fetch chat sessions:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this session?')) return;

        try {
            const response = await fetch(`/api/chat-sessions/${sessionId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className={cn(
                    "fixed left-0 top-1/2 -translate-y-1/2 z-40",
                    "bg-background/95 backdrop-blur-md border border-border/50 rounded-r-xl",
                    "p-2 transition-all hover:bg-accent/50",
                    className
                )}
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        );
    }

    return (
        <div
            className={cn(
                "fixed left-0 top-14 bottom-0 z-40",
                "w-64 bg-background/95 backdrop-blur-md border-r border-border/50",
                "flex flex-col",
                className
            )}
        >
            {/* Header */}
            <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Chat History</h2>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 hover:bg-accent rounded-md"
                >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
            </div>

            {/* New Session Button */}
            <div className="p-2">
                <button
                    onClick={onNewSession}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Session
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-14 bg-accent/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No sessions yet</p>
                        <p className="text-xs mt-1">Start a conversation!</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSessionSelect?.(session)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    onSessionSelect?.(session);
                                }
                            }}
                            className={cn(
                                "w-full text-left p-2.5 rounded-lg group transition-all cursor-pointer",
                                "hover:bg-accent/50",
                                currentSessionId === session.id && "bg-primary/10 ring-1 ring-primary/30"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium truncate">
                                            {session.title}
                                        </span>
                                        {session.genz_mode && (
                                            <span className="text-xs">🔥</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                        <span>{formatDate(session.created_at)}</span>
                                        {session.duration_seconds > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDuration(session.duration_seconds)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {session.summary && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {session.summary}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer with session count */}
            <div className="p-2 border-t border-border/50 text-xs text-muted-foreground text-center">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
