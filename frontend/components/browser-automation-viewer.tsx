'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './browser-automation-viewer.css';

interface BrowserAutomationViewerProps {
    isActive: boolean;
    task?: string;
    onClose?: () => void;
}

interface BrowserState {
    is_running: boolean;
    current_task: string | null;
    screenshots: string[];
    status: string;
    step: number;
    total_steps: number;
    current_url: string | null;
    error: string | null;
    screenshotCount: number;
    lastScreenshotIndex: number;
}

export default function BrowserAutomationViewer({
    isActive,
    task = '',
    onClose
}: BrowserAutomationViewerProps) {
    const [state, setState] = useState<BrowserState | null>(null);
    const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastIndexRef = useRef(0);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Start browser automation
    const startAutomation = useCallback(async (automationTask: string) => {
        setIsStarting(true);
        setError(null);
        lastIndexRef.current = 0;

        try {
            const response = await fetch('/api/browser-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: automationTask })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start automation');
            }

            // Start polling for updates
            startPolling();

        } catch (err) {
            console.error('Failed to start automation:', err);
            setError(err instanceof Error ? err.message : 'Failed to start');
        } finally {
            setIsStarting(false);
        }
    }, []);

    // Poll for browser state and screenshots
    const pollState = useCallback(async () => {
        try {
            const response = await fetch(`/api/browser-stream?since=${lastIndexRef.current}`);
            const data: BrowserState = await response.json();

            setState(data);

            // Update screenshot if new ones available
            if (data.screenshots && data.screenshots.length > 0) {
                const latestScreenshot = data.screenshots[data.screenshots.length - 1];
                setCurrentScreenshot(latestScreenshot);
                lastIndexRef.current = data.lastScreenshotIndex || 0;
            }

            // Stop polling if completed or error
            if (!data.is_running && data.status !== 'idle') {
                stopPolling();
            }

        } catch (err) {
            console.error('Failed to poll state:', err);
        }
    }, []);

    const startPolling = useCallback(() => {
        if (pollingRef.current) return;

        // Poll every 500ms for updates
        pollingRef.current = setInterval(pollState, 500);
        pollState(); // Immediate first poll
    }, [pollState]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Start automation when task changes
    useEffect(() => {
        if (isActive && task) {
            startAutomation(task);
        }

        return () => {
            stopPolling();
        };
    }, [isActive, task, startAutomation, stopPolling]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    if (!isActive) return null;

    const isSvg = currentScreenshot && !currentScreenshot.startsWith('/9j/');
    const screenshotSrc = currentScreenshot
        ? (isSvg
            ? `data:image/svg+xml;base64,${currentScreenshot}`
            : `data:image/jpeg;base64,${currentScreenshot}`)
        : null;

    return (
        <div className="browser-viewer-overlay">
            <div className="browser-viewer-container">
                {/* Header */}
                <div className="browser-viewer-header">
                    <div className="browser-viewer-title">
                        <div className="browser-indicator">
                            <span className={`status-dot ${state?.is_running ? 'running' : state?.status === 'completed' ? 'completed' : 'idle'}`} />
                            <span>AI Web Browser</span>
                        </div>
                        {state?.current_url && (
                            <span className="current-url">{state.current_url}</span>
                        )}
                    </div>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                {/* Progress Bar */}
                {state && state.total_steps > 0 && (
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${(state.step / state.total_steps) * 100}%` }}
                        />
                    </div>
                )}

                {/* Screenshot Display */}
                <div className="screenshot-display">
                    {isStarting && (
                        <div className="loading-state">
                            <div className="loading-spinner" />
                            <p>Starting browser...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <span className="error-icon">⚠️</span>
                            <p>{error}</p>
                            <button onClick={() => task && startAutomation(task)}>Try Again</button>
                        </div>
                    )}

                    {!isStarting && !error && screenshotSrc && (
                        <img
                            src={screenshotSrc}
                            alt="Browser screenshot"
                            className="screenshot-image"
                        />
                    )}

                    {!isStarting && !error && !currentScreenshot && state?.is_running && (
                        <div className="loading-state">
                            <div className="loading-spinner" />
                            <p>Capturing screenshot...</p>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="status-bar">
                    <div className="status-info">
                        {state?.status && (
                            <span className="status-text">
                                {state.is_running ? '🔄' : state.status === 'completed' ? '✅' : '⏸️'}
                                {' '}{state.status}
                            </span>
                        )}
                    </div>
                    <div className="step-info">
                        {state && state.total_steps > 0 && (
                            <span>Step {state.step} of {state.total_steps}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Also export as named for compatibility
export { BrowserAutomationViewer };
