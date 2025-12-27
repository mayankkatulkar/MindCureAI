import { NextResponse } from 'next/server';
import { AccessToken, TrackSource } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// POST - Create a therapist session room and get token
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

        const { sessionRequestId, roomName, callType } = await request.json();

        // If roomName is provided, user is joining an existing session
        if (roomName) {
            // Verify user is authorized for this session
            const { data: session } = await supabase
                .from('therapist_session_requests')
                .select('*, therapist:therapists(profile:profiles(full_name))')
                .eq('room_name', roomName)
                .or(`user_id.eq.${user.id},therapist_id.eq.${user.id}`)
                .single();

            if (!session) {
                return NextResponse.json(
                    { error: 'Session not found or unauthorized' },
                    { status: 403 }
                );
            }

            // Get user's display name
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, user_type')
                .eq('id', user.id)
                .single();

            const isTherapist = profile?.user_type === 'therapist' || session.therapist_id === user.id;
            const participantName = profile?.full_name || (isTherapist ? 'Therapist' : 'Client');
            const identity = `${isTherapist ? 'therapist' : 'client'}_${user.id.substring(0, 8)}`;

            // Create access token
            const at = new AccessToken(API_KEY, API_SECRET, {
                identity,
                name: participantName,
                ttl: '2h', // 2 hours for therapy sessions
            });

            at.addGrant({
                room: roomName,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
                canPublishSources: callType === 'voice'
                    ? [TrackSource.MICROPHONE]
                    : [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
            });

            const token = await at.toJwt();

            // Update session status to 'in_progress' if not already
            if (session.status === 'accepted' || session.status === 'pending') {
                await supabase
                    .from('therapist_session_requests')
                    .update({ status: 'in_progress' })
                    .eq('id', session.id);
            }

            return NextResponse.json({
                token,
                serverUrl: LIVEKIT_URL,
                roomName,
                participantName,
                therapistName: session.therapist?.profile?.full_name || 'Therapist',
                sessionId: session.id,
            });
        }

        // If sessionRequestId is provided, create a new session room
        if (sessionRequestId) {
            // Verify the session request exists and belongs to user
            const { data: sessionRequest, error } = await supabase
                .from('therapist_session_requests')
                .select('*, therapist:therapists(profile:profiles(full_name))')
                .eq('id', sessionRequestId)
                .single();

            if (error || !sessionRequest) {
                return NextResponse.json(
                    { error: 'Session request not found' },
                    { status: 404 }
                );
            }

            // Check if user is authorized (either the user or therapist)
            const isUser = sessionRequest.user_id === user.id;
            const isTherapist = sessionRequest.therapist_id === user.id;

            if (!isUser && !isTherapist) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 403 }
                );
            }

            // Check if payment is required and completed
            if (sessionRequest.payment_status === 'pending' && !isTherapist) {
                return NextResponse.json(
                    { error: 'Payment required before starting session' },
                    { status: 402 }
                );
            }

            // Generate room name if not already set
            const sessionRoomName = sessionRequest.room_name ||
                `therapy-${sessionRequest.id.substring(0, 8)}-${Date.now()}`;

            // Update session with room name if new
            if (!sessionRequest.room_name) {
                await supabase
                    .from('therapist_session_requests')
                    .update({
                        room_name: sessionRoomName,
                        status: 'accepted'
                    })
                    .eq('id', sessionRequestId);
            }

            // Get user's profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, user_type')
                .eq('id', user.id)
                .single();

            const participantName = profile?.full_name || (isTherapist ? 'Therapist' : 'Client');
            const identity = `${isTherapist ? 'therapist' : 'client'}_${user.id.substring(0, 8)}`;

            // Create access token
            const at = new AccessToken(API_KEY, API_SECRET, {
                identity,
                name: participantName,
                ttl: '2h',
            });

            at.addGrant({
                room: sessionRoomName,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
                canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
            });

            const token = await at.toJwt();

            return NextResponse.json({
                token,
                serverUrl: LIVEKIT_URL,
                roomName: sessionRoomName,
                participantName,
                therapistName: sessionRequest.therapist?.profile?.full_name || 'Therapist',
                sessionId: sessionRequest.id,
            });
        }

        return NextResponse.json(
            { error: 'Either roomName or sessionRequestId is required' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Therapist Session API Error:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}

// PUT - Update session status (complete, cancel, etc.)
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, status, durationMinutes, notes } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // Verify authorization
        const { data: session } = await supabase
            .from('therapist_session_requests')
            .select('*')
            .eq('id', sessionId)
            .or(`user_id.eq.${user.id},therapist_id.eq.${user.id}`)
            .single();

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Update session
        const updateData: any = { updated_at: new Date().toISOString() };

        if (status) updateData.status = status;
        if (notes) updateData.notes = notes;

        await supabase
            .from('therapist_session_requests')
            .update(updateData)
            .eq('id', sessionId);

        // If completing session, create a therapy session record
        if (status === 'completed' && durationMinutes) {
            await supabase
                .from('therapy_sessions')
                .insert({
                    user_id: session.user_id,
                    session_type: 'therapist',
                    duration_minutes: durationMinutes,
                    notes: notes || 'Video therapy session',
                });

            // Update therapist's total sessions count
            await supabase.rpc('increment_therapist_sessions', {
                therapist_id: session.therapist_id
            });
        }

        return NextResponse.json({ success: true, message: 'Session updated' });

    } catch (error) {
        console.error('Session Update Error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}
