'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { CallTraceProvider } from '@/components/call-trace-provider';
import { CallTraceHandler } from '@/components/call-trace-handler';
import { SessionView } from '@/components/session-view';
import { Toaster } from '@/components/ui/sonner';
import { Welcome } from '@/components/welcome';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import type { AppConfig } from '@/lib/types';
import type { GeminiVoice } from '@/components/voice-settings';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [genZMode, setGenZMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoice>('Kore');
  const { connectionDetails, refreshConnectionDetails, isLoading } = useConnectionDetails();
  // const { startSession, endSession, isInRoomContext } = useCallTraceContext(); // Removed
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const onDisconnected = async () => {
      // Logic for saving call trace moved to CallTraceHandler
      setSessionStarted(false);
      setIsConnecting(false);
      // Don't auto-refresh connection details - wait for user to click again
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected' && connectionDetails) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ]).then(() => {
        // Set participant metadata with voice and mode preferences
        const participantMetadata = JSON.stringify({
          genz_mode: genZMode,
          voice: selectedVoice,
        });
        room.localParticipant.setMetadata(participantMetadata);
      }).catch((error) => {
        if (aborted) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionStarted, connectionDetails, appConfig.isPreConnectBufferEnabled, genZMode, selectedVoice]);

  const { startButtonText } = appConfig;

  // Fetch connection details when session starts (lazy loading to save API quota)
  useEffect(() => {
    if (sessionStarted && !connectionDetails && !isLoading) {
      setIsConnecting(true);
      refreshConnectionDetails();
    }
  }, [sessionStarted, connectionDetails, isLoading, refreshConnectionDetails]);

  // Call trace session management moved to CallTraceHandler

  return (
    <CallTraceProvider room={room}>
      <MotionWelcome
        key="welcome"
        startButtonText={startButtonText}
        onStartCall={() => setSessionStarted(true)}
        onVoiceChange={setSelectedVoice}
        onGenZModeChange={setGenZMode}
        disabled={sessionStarted}
        initial={{ opacity: 0 }}
        animate={{ opacity: sessionStarted ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'linear', delay: sessionStarted ? 0 : 0.5 }}
      />

      <RoomContext.Provider value={room}>
        <CallTraceHandler room={room} sessionStarted={sessionStarted} />
        <RoomAudioRenderer />
        <StartAudio label="Start Audio" />
        {/* --- */}
        <MotionSessionView
          key="session-view"
          appConfig={appConfig}
          disabled={!sessionStarted}
          sessionStarted={sessionStarted}
          initial={{ opacity: 0 }}
          animate={{ opacity: sessionStarted ? 1 : 0 }}
          transition={{
            duration: 0.5,
            ease: 'linear',
            delay: sessionStarted ? 0.5 : 0,
          }}
        />
      </RoomContext.Provider>

      <Toaster />
    </CallTraceProvider>
  );
}
