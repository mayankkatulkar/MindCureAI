'use client';

import { useState, useCallback } from 'react';
import { App } from '@/components/app';
import { ChatHistory } from '@/components/chat-history';
import { SessionInsightsDashboard } from '@/components/session-insights-dashboard';
import type { AppConfig, ChatSession } from '@/lib/types';

interface VoiceChatLayoutProps {
    appConfig: AppConfig;
}

export function VoiceChatLayout({ appConfig }: VoiceChatLayoutProps) {
    const [showHistory, setShowHistory] = useState(true);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string>();

    const handleSessionSelect = useCallback((session: ChatSession) => {
        setSelectedSession(session);
        setCurrentSessionId(session.id);
    }, []);

    const handleNewSession = useCallback(() => {
        setCurrentSessionId(undefined);
        // Refresh the app to start a new session
        window.location.reload();
    }, []);

    return (
        <div className="relative">
            {/* Chat History Sidebar */}
            <ChatHistory
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                currentSessionId={currentSessionId}
            />

            {/* Main App or Insights - shifted right when sidebar is open */}
            <div className={showHistory ? 'ml-64' : ''}>
                {selectedSession ? (
                    <SessionInsightsDashboard
                        session={selectedSession}
                        onBack={() => {
                            setSelectedSession(null);
                            setCurrentSessionId(undefined);
                        }}
                    />
                ) : (
                    <App appConfig={appConfig} />
                )}
            </div>
        </div>
    );
}
