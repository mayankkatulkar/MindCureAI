'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    LiveKitRoom,
    VideoTrack,
    AudioTrack,
    useLocalParticipant,
    useRemoteParticipants,
    useParticipantTracks,
    RoomAudioRenderer,
    useTracks,
} from '@livekit/components-react';
import { Track, Room, RoomEvent } from 'livekit-client';

interface VideoCallProps {
    roomName: string;
    participantName: string;
    onDisconnect?: () => void;
    callType?: 'peer-support' | 'therapist' | 'general';
    mode?: 'video' | 'voice';
}

interface ConnectionDetails {
    token: string;
    serverUrl: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({
    roomName,
    participantName,
    onDisconnect,
    callType = 'general',
    mode = 'video',
}) => {
    const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch token for the room
    useEffect(() => {
        const fetchToken = async () => {
            try {
                setIsLoading(true);
                const endpoint = callType === 'therapist'
                    ? '/api/therapist-session'
                    : '/api/peer-token';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName,
                        callType: mode,
                        participantName
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to get connection token');
                }

                const data = await response.json();
                setConnectionDetails({
                    token: data.token,
                    serverUrl: data.serverUrl,
                });
            } catch (err) {
                console.error('Error fetching token:', err);
                setError(err instanceof Error ? err.message : 'Failed to connect');
            } finally {
                setIsLoading(false);
            }
        };

        fetchToken();
    }, [roomName, callType, mode, participantName]);

    const handleDisconnect = useCallback(() => {
        onDisconnect?.();
    }, [onDisconnect]);

    if (isLoading) {
        return (
            <div className="video-call-container h-full w-full bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Connecting to {callType === 'therapist' ? 'therapist' : 'peer'}...</p>
                </div>
            </div>
        );
    }

    if (error || !connectionDetails) {
        return (
            <div className="video-call-container h-full w-full bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-red-400 mb-4">{error || 'Failed to connect'}</p>
                    <button
                        onClick={handleDisconnect}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={connectionDetails.token}
            serverUrl={connectionDetails.serverUrl}
            connect={true}
            video={mode === 'video'}
            audio={true}
            onDisconnected={handleDisconnect}
            className="h-full w-full"
        >
            <RoomAudioRenderer />
            <VideoCallContent
                callType={callType}
                roomName={roomName}
                mode={mode}
                onDisconnect={handleDisconnect}
            />
        </LiveKitRoom>
    );
};

// Inner component that uses LiveKit hooks
function VideoCallContent({
    callType,
    roomName,
    mode,
    onDisconnect
}: {
    callType: string;
    roomName: string;
    mode: string;
    onDisconnect: () => void;
}) {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();
    const [isConnected, setIsConnected] = useState(false);
    const [duration, setDuration] = useState(0);

    // Track connection status
    useEffect(() => {
        setIsConnected(true);
    }, []);

    // Session duration timer
    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isConnected]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleMic = async () => {
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    };

    const toggleCamera = async () => {
        await localParticipant.setCameraEnabled(!isCameraEnabled);
    };

    return (
        <div className="video-call-container h-full w-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-white text-sm font-medium">
                        {callType === 'peer-support' ? 'Peer Support Call' :
                            callType === 'therapist' ? 'Therapist Session' : 'Video Call'}
                    </span>
                    <span className="text-gray-400 text-sm">• {formatDuration(duration)}</span>
                </div>
                <span className="text-gray-400 text-xs">
                    {remoteParticipants.length + 1} participant{remoteParticipants.length > 0 ? 's' : ''}
                </span>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900 p-4">
                {/* Remote Participants */}
                {remoteParticipants.length > 0 ? (
                    <div className="grid gap-4 h-full" style={{
                        gridTemplateColumns: remoteParticipants.length === 1 ? '1fr' : 'repeat(2, 1fr)'
                    }}>
                        {remoteParticipants.map((participant) => (
                            <ParticipantView
                                key={participant.sid}
                                participant={participant}
                                isRemote={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center animate-pulse">
                                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <p className="text-gray-400">Waiting for {callType === 'therapist' ? 'therapist' : 'peer'} to join...</p>
                        </div>
                    </div>
                )}

                {/* Self View (Picture-in-Picture) */}
                {mode === 'video' && (
                    <div className="absolute bottom-4 right-4 w-40 h-32 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden shadow-lg">
                        <LocalParticipantView />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 p-4 bg-gray-800/80 backdrop-blur-sm">
                {/* Mic Toggle */}
                <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-colors ${isMicrophoneEnabled
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                >
                    {isMicrophoneEnabled ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    )}
                </button>

                {/* Camera Toggle (Video mode only) */}
                {mode === 'video' && (
                    <button
                        onClick={toggleCamera}
                        className={`p-4 rounded-full transition-colors ${isCameraEnabled
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {isCameraEnabled ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* End Call */}
                <button
                    onClick={onDisconnect}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// Component to render a participant's video
function ParticipantView({ participant, isRemote }: { participant: any; isRemote: boolean }) {
    const tracks = useParticipantTracks(
        [Track.Source.Camera, Track.Source.Microphone],
        participant.identity
    );

    const videoTrack = tracks.find(t => t.source === Track.Source.Camera);
    const audioTrack = tracks.find(t => t.source === Track.Source.Microphone);

    return (
        <div className="relative h-full w-full bg-gray-800 rounded-lg overflow-hidden">
            {videoTrack ? (
                <VideoTrack
                    trackRef={videoTrack}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl text-white font-bold">
                        {participant.name?.[0]?.toUpperCase() || '?'}
                    </div>
                </div>
            )}

            {audioTrack && <AudioTrack trackRef={audioTrack} />}

            {/* Participant name overlay */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                {participant.name || 'Anonymous'}
            </div>
        </div>
    );
}

// Component for local participant's video
function LocalParticipantView() {
    const { localParticipant, isCameraEnabled } = useLocalParticipant();
    const tracks = useTracks([Track.Source.Camera]);
    const videoTrack = tracks.find(t => t.participant.sid === localParticipant.sid);

    if (!isCameraEnabled || !videoTrack) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <span className="text-gray-500 text-xs">Camera off</span>
            </div>
        );
    }

    return (
        <VideoTrack
            trackRef={videoTrack}
            className="w-full h-full object-cover"
        />
    );
}

export default VideoCall;
