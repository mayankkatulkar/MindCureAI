import { NextResponse } from 'next/server';
import { AccessToken, TrackSource } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
            return NextResponse.json(
                { error: 'LiveKit credentials not configured' },
                { status: 500 }
            );
        }

        const { roomName, callType } = await request.json();

        if (!roomName) {
            return NextResponse.json(
                { error: 'Room name is required' },
                { status: 400 }
            );
        }

        // Verify the room exists and user is part of this connection
        const { data: connection } = await supabase
            .from('peer_connections')
            .select('*')
            .eq('room_name', roomName)
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .single();

        if (!connection) {
            return NextResponse.json(
                { error: 'Invalid room or unauthorized' },
                { status: 403 }
            );
        }

        // Get user's display name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const participantName = profile?.full_name || 'Anonymous Peer';
        const identity = `peer_${user.id.substring(0, 8)}`;

        // Create access token
        const at = new AccessToken(API_KEY, API_SECRET, {
            identity,
            name: participantName,
            ttl: '1h', // 1 hour for peer sessions
        });

        // Grant permissions based on call type
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            // Enable video for video calls, audio only for voice
            canPublishSources: callType === 'video'
                ? [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE]
                : [TrackSource.MICROPHONE],
        });

        const token = await at.toJwt();

        return NextResponse.json({
            token,
            serverUrl: LIVEKIT_URL,
            roomName,
            participantName,
        });

    } catch (error) {
        console.error('Peer Token API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
