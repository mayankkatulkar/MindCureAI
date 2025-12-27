'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { VideoCall } from '@/components/VideoCall';

interface SessionDetails {
    id: string;
    therapistName: string;
    status: string;
    roomName?: string;
    scheduledAt?: string;
}

function TherapistVideoContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session');
    const success = searchParams.get('success');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
    const [inSession, setInSession] = useState(false);
    const [callType, setCallType] = useState<'video' | 'voice'>('video');

    // Fetch session details if sessionId is provided
    useEffect(() => {
        const fetchSession = async () => {
            if (!sessionId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/therapist-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionRequestId: sessionId }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    if (response.status === 402) {
                        setError('Payment required. Please complete payment to start the session.');
                    } else {
                        setError(data.error || 'Failed to load session');
                    }
                    setIsLoading(false);
                    return;
                }

                const data = await response.json();
                setSessionDetails({
                    id: sessionId,
                    therapistName: data.therapistName,
                    status: 'ready',
                    roomName: data.roomName,
                });
            } catch (err) {
                console.error('Error fetching session:', err);
                setError('Failed to connect to session');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, [sessionId]);

    const startSession = () => {
        if (sessionDetails?.roomName) {
            setInSession(true);
        }
    };

    const endSession = async () => {
        setInSession(false);

        // Update session status to completed
        if (sessionDetails?.id) {
            try {
                await fetch('/api/therapist-session', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sessionDetails.id,
                        status: 'completed',
                        // Duration would be tracked client-side
                    }),
                });
            } catch (err) {
                console.error('Error ending session:', err);
            }
        }
    };

    // If in an active video session
    if (inSession && sessionDetails?.roomName) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
                <div className="max-w-5xl mx-auto h-[calc(100vh-2rem)]">
                    <VideoCall
                        roomName={sessionDetails.roomName}
                        participantName="Client"
                        onDisconnect={endSession}
                        callType="therapist"
                        mode={callType}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <AppHeader />
            <div className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">

                        {/* Success Banner */}
                        {success && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="font-semibold text-green-600 dark:text-green-400">Payment Successful!</p>
                                    <p className="text-sm text-muted-foreground">Your session has been confirmed. Start when you're ready.</p>
                                </div>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold mb-4">
                            {sessionDetails ? `Session with ${sessionDetails.therapistName}` : 'Video Session with Therapist'}
                        </h1>
                        <p className="text-muted-foreground mb-8">
                            Connect face-to-face with your therapist through secure video calls.
                        </p>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="bg-card rounded-lg border border-border p-12 text-center">
                                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading session details...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
                                <span className="text-4xl mb-4 block">⚠️</span>
                                <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error}</p>
                                <a
                                    href="/therapist-directory"
                                    className="text-sm text-purple-600 hover:underline"
                                >
                                    Return to Therapist Directory
                                </a>
                            </div>
                        )}

                        {/* Session Ready State */}
                        {!isLoading && !error && sessionDetails && (
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                                {/* Video Preview Area */}
                                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <span className="text-4xl">👨‍⚕️</span>
                                        </div>
                                        <p className="text-white text-lg font-medium mb-2">{sessionDetails.therapistName}</p>
                                        <p className="text-gray-400">Ready to connect</p>
                                    </div>
                                </div>

                                {/* Session Type Selection */}
                                <div className="p-6 border-b border-border">
                                    <p className="text-sm font-medium mb-3">Session Type</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setCallType('video')}
                                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${callType === 'video'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            📹 Video Call
                                        </button>
                                        <button
                                            onClick={() => setCallType('voice')}
                                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${callType === 'voice'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            🎤 Voice Only
                                        </button>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="p-6 flex items-center justify-center gap-4">
                                    <button
                                        onClick={startSession}
                                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
                                    >
                                        Start Session
                                    </button>
                                    <a
                                        href="/therapist-directory"
                                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* No Session - Prompt to Book */}
                        {!isLoading && !error && !sessionDetails && !sessionId && (
                            <div className="bg-card rounded-lg border border-border p-8 text-center">
                                <span className="text-5xl mb-4 block">📅</span>
                                <h3 className="text-xl font-bold mb-2">No Active Session</h3>
                                <p className="text-muted-foreground mb-6">
                                    Book a session with a therapist to get started.
                                </p>
                                <a
                                    href="/therapist-directory"
                                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Find a Therapist
                                </a>
                            </div>
                        )}

                        {/* Session Info */}
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            <div className="bg-card rounded-lg border border-border p-4">
                                <h3 className="font-semibold mb-2">🔒 Secure & Private</h3>
                                <p className="text-sm text-muted-foreground">End-to-end encrypted video sessions</p>
                            </div>
                            <div className="bg-card rounded-lg border border-border p-4">
                                <h3 className="font-semibold mb-2">📱 Any Device</h3>
                                <p className="text-sm text-muted-foreground">Works on desktop, tablet, or mobile</p>
                            </div>
                            <div className="bg-card rounded-lg border border-border p-4">
                                <h3 className="font-semibold mb-2">📋 Session Notes</h3>
                                <p className="text-sm text-muted-foreground">AI-powered session summaries</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function TherapistVideoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <TherapistVideoContent />
        </Suspense>
    );
}
