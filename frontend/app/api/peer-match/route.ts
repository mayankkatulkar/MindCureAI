import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, interests } = await request.json();

        if (action === 'join_queue') {
            // Add user to matching queue - using 'challenges' column from schema
            const { error } = await supabase
                .from('peer_matching_queue')
                .upsert({
                    user_id: user.id,
                    challenges: interests || [], // Use challenges column from schema
                    status: 'waiting',
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Queue join error:', error);
                throw error;
            }

            // Try to find a match immediately using the RPC function
            const { data: matchId, error: matchError } = await supabase
                .rpc('find_peer_match', { p_user_id: user.id });

            if (matchError) {
                console.error('Match function error:', matchError);
                // If RPC fails, try manual matching
                const { data: potentialMatch } = await supabase
                    .from('peer_matching_queue')
                    .select('user_id, challenges')
                    .neq('user_id', user.id)
                    .eq('status', 'waiting')
                    .limit(1)
                    .single();

                if (potentialMatch) {
                    // Create connection between users
                    const roomName = `peer-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    await supabase.from('peer_connections').insert({
                        user1_id: user.id,
                        user2_id: potentialMatch.user_id,
                        matched_on: potentialMatch.challenges || [],
                        status: 'active',
                        room_name: roomName
                    });

                    // Update both users' queue status
                    await supabase
                        .from('peer_matching_queue')
                        .update({ status: 'matched' })
                        .in('user_id', [user.id, potentialMatch.user_id]);

                    return NextResponse.json({
                        status: 'matched',
                        match: {
                            id: potentialMatch.user_id,
                            alias: 'Anonymous Peer',
                            mood: 'Ready to listen',
                            roomId: roomName
                        }
                    });
                }
            } else if (matchId) {
                // Match found via RPC
                const roomName = `peer-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                // Create peer connection
                await supabase.from('peer_connections').insert({
                    user1_id: user.id,
                    user2_id: matchId,
                    status: 'active',
                    room_name: roomName
                });

                // Update queue status
                await supabase
                    .from('peer_matching_queue')
                    .update({ status: 'matched' })
                    .in('user_id', [user.id, matchId]);

                return NextResponse.json({
                    status: 'matched',
                    match: {
                        id: matchId,
                        alias: 'Anonymous Peer',
                        mood: 'Ready to listen',
                        roomId: roomName
                    }
                });
            }

            return NextResponse.json({ status: 'waiting' });

        } else if (action === 'check_status') {
            // Check if we have been matched
            const { data: connection } = await supabase
                .from('peer_connections')
                .select('*')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (connection) {
                const peerId = connection.user1_id === user.id ? connection.user2_id : connection.user1_id;
                return NextResponse.json({
                    status: 'matched',
                    match: {
                        id: peerId,
                        alias: 'Anonymous Peer',
                        roomId: connection.room_name // Use room_name from schema
                    }
                });
            }

            return NextResponse.json({ status: 'waiting' });

        } else if (action === 'leave_queue') {
            await supabase.from('peer_matching_queue').delete().eq('user_id', user.id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Peer Match API Error:', error);
        return NextResponse.json({ error: 'Failed to process matching request' }, { status: 500 });
    }
}

