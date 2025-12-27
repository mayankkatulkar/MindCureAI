'use client';

import { useEffect } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { useCallTraceContext } from '@/components/call-trace-provider';

interface CallTraceHandlerProps {
    room: Room;
    sessionStarted: boolean;
}

export function CallTraceHandler({ room, sessionStarted }: CallTraceHandlerProps) {
    const { startSession, endSession, isInRoomContext } = useCallTraceContext();

    // Handle session start
    useEffect(() => {
        if (sessionStarted) {
            console.log('[CallTraceHandler] Session started, calling startSession()');
            startSession();
        }
    }, [sessionStarted, startSession]);

    // Handle disconnection
    useEffect(() => {
        const handleDisconnect = async () => {
            // We only save if we were tracking a session
            if (isInRoomContext) {
                await endSession();
            }
        };

        room.on(RoomEvent.Disconnected, handleDisconnect);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnect);
        };
    }, [room, endSession, isInRoomContext]);

    // Handle component unmount (cleanup)
    useEffect(() => {
        return () => {
            if (sessionStarted) {
                endSession();
            }
        };
    }, [sessionStarted, endSession]);

    return null;
}
