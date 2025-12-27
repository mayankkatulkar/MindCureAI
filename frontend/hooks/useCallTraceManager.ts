import { useCallback, useRef, useState } from 'react';
import { Room } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import type { ReceivedChatMessage } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { getVoiceSettings } from '@/components/voice-settings';
import { analyzeSession } from '@/lib/analysis-service';

export interface CallTraceData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messages: ReceivedChatMessage[];
  participantCount: number;
  duration?: number;
  messageCount: number;
  userMessageCount: number;
  agentMessageCount: number;
}

export function useCallTraceManager(roomInstance?: Room) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const sessionDataRef = useRef<CallTraceData | null>(null);
  const [messages, setMessages] = useState<ReceivedChatMessage[]>([]);

  // Get room context - handle both direct room instance and hook
  let contextRoom: Room | undefined;
  try {
    contextRoom = useRoomContext();
  } catch (e) {
    // Ignore error if used outside RoomContext
  }

  const room = roomInstance || contextRoom;
  const isInRoomContext = !!(room && room.state !== 'disconnected');

  // Safe room access
  const getParticipantCount = useCallback(() => {
    try {
      return isInRoomContext ? room.numParticipants : 1;
    } catch (error) {
      console.warn('Could not access room participant count:', error);
      return 1;
    }
  }, [isInRoomContext, room]);

  // Initialize session data when session starts
  const startSession = useCallback(() => {
    // If we already have an active session, don't reinitialize
    if (sessionDataRef.current) {
      console.log('[CallTrace] startSession called but session already exists, skipping');
      return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionDataRef.current = {
      sessionId,
      startTime: new Date(),
      messages: [],
      participantCount: getParticipantCount(),
      messageCount: 0,
      userMessageCount: 0,
      agentMessageCount: 0,
    };
    setIsSessionActive(true);
  }, [getParticipantCount]);

  // Helper to ensure session exists (lazy initialization for race conditions)
  const ensureSession = useCallback(() => {
    if (!sessionDataRef.current) {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionDataRef.current = {
        sessionId,
        startTime: new Date(),
        messages: [],
        participantCount: getParticipantCount(),
        messageCount: 0,
        userMessageCount: 0,
        agentMessageCount: 0,
      };
      setIsSessionActive(true);
    }
  }, [getParticipantCount]);

  // Add message to session data
  // Add or update message in session data
  const addMessage = useCallback((message: ReceivedChatMessage) => {
    // Ensure session exists (handles race condition where message arrives before startSession)
    ensureSession();

    if (sessionDataRef.current) {
      const existingIndex = sessionDataRef.current.messages.findIndex(m => m.id === message.id);

      if (existingIndex >= 0) {
        // Update existing message (e.g. transcription update)
        sessionDataRef.current.messages[existingIndex] = message;
      } else {
        // Add new message
        sessionDataRef.current.messages.push(message);
        sessionDataRef.current.messageCount++;

        if (message.from?.isLocal) {
          sessionDataRef.current.userMessageCount++;
        } else {
          sessionDataRef.current.agentMessageCount++;
        }
      }
    } else {
      console.warn('No session data available, cannot add message to call trace');
    }

    // Also update local state (handle deduplication)
    setMessages((prev) => {
      const index = prev.findIndex(m => m.id === message.id);
      if (index >= 0) {
        const newMessages = [...prev];
        newMessages[index] = message;
        return newMessages;
      }
      return [...prev, message];
    });
  }, [ensureSession]);

  // End session and save call trace
  // End session and save call trace
  const endSession = useCallback(async () => {
    if (!sessionDataRef.current) {
      console.log('No session data to save');
      return;
    }

    // prevent double saving by clearing ref immediately
    const sessionData = sessionDataRef.current;
    sessionDataRef.current = null;
    setIsSessionActive(false);

    sessionData.endTime = new Date();
    sessionData.duration = sessionData.endTime.getTime() - sessionData.startTime.getTime();

    // Short sessions (e.g. < 1s) usually indicate accidental starts or errors
    if (sessionData.duration < 1000) {
      console.log('[CallTrace] Session too short, discarding');
      setMessages([]);
      return;
    }

    // Get current voice settings and API key
    const { voice, genZMode } = getVoiceSettings();
    const apiKey = localStorage.getItem('gemini_api_key') || '';

    // Auto-analysis removed for On-Demand model
    const analysisResult = null; // Analysis will be triggered manually by user in dashboard

    // Create call trace data
    const callTrace = {
      id: sessionData.sessionId,
      timestamp: sessionData.startTime.toISOString(),
      sessionId: sessionData.sessionId,
      messageType: 'session',
      message: `Session with ${sessionData.messageCount} messages`,
      responseTime: sessionData.duration,
      tokenCount: sessionData.messageCount * 10, // Estimate
      confidence: 0.95,
      status: 'success',
      metadata: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        userId: `user-${Date.now()}`,
        sessionDuration: Math.floor(sessionData.duration / 1000),
        participantCount: sessionData.participantCount,
        messageCount: sessionData.messageCount,
        userMessageCount: sessionData.userMessageCount,
        agentMessageCount: sessionData.agentMessageCount,
        analysis: analysisResult,
        messages: sessionData.messages.map((msg) => ({
          id: msg.id,
          timestamp: msg.timestamp,
          message: msg.message,
          from: msg.from?.identity || 'unknown',
          isLocal: msg.from?.isLocal || false,
        })),
      },
    };

    try {
      // Clean up transcript - only save essential fields, not internal LiveKit objects
      const cleanTranscript = sessionData.messages.map((msg) => ({
        id: msg.id,
        timestamp: msg.timestamp,
        message: msg.message,
        from: msg.from?.identity || 'unknown',
        isLocal: msg.from?.isLocal || false,
      }));

      const payload = {
        title: `Session with Dr. Sarah ${new Date().toLocaleDateString()}`,
        voice_used: voice,
        genz_mode: genZMode,
        duration_seconds: Math.round(sessionData.duration / 1000),
        transcript: cleanTranscript,
        metadata: {
          ...callTrace.metadata,
          sessionId: sessionData.sessionId
        }
      };

      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('POST failed:', errorText);
        throw new Error(`Failed to save session: ${response.status}`);
      }

      const savedData = await response.json();

      toastAlert({
        title: 'Session Saved',
        description: 'Your conversation has been saved to your history.',
      });
    } catch (error) {
      console.error('Error saving call trace:', error);
      toastAlert({
        title: 'Error Saving Session',
        description: 'Could not save your session history.',
      });
    }

    setMessages([]);
  }, []);

  return {
    isSessionActive,
    messages,
    startSession,
    endSession,
    addMessage,
    isInRoomContext,
  };
}
