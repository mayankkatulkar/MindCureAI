import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a therapist
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();

        if (profile?.user_type !== 'therapist') {
            return NextResponse.json({ error: 'Access denied: Therapists only' }, { status: 403 });
        }

        // Fetch therapist details
        const { data: therapist } = await supabase
            .from('therapists')
            .select('*')
            .eq('id', user.id)
            .single();

        // Fetch upcoming sessions (bookings)
        const { data: bookings } = await supabase
            .from('therapist_bookings')
            .select('*')
            .eq('therapist_id', user.id)
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5);

        // Fetch pending session requests (from AI handoff)
        const { data: requests } = await supabase
            .from('therapist_session_requests')
            .select('*, profiles:user_id(full_name, email)') // Join with profiles to get user name
            .eq('therapist_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        // Mock earnings for now (or calculate from completed sessions)
        const earnings = {
            today: 150,
            week: 850,
            month: 3200
        };

        return NextResponse.json({
            therapist,
            bookings: bookings || [],
            requests: requests || [],
            earnings
        });

    } catch (error) {
        console.error('Therapist Dashboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { requestId, action, notes } = await request.json(); // action: 'accept' | 'decline'

        if (!requestId || !action) {
            return NextResponse.json({ error: 'Missing requestId or action' }, { status: 400 });
        }

        if (action === 'accept') {
            // Update request status
            const { data: request } = await supabase
                .from('therapist_session_requests')
                .update({ status: 'accepted', notes })
                .eq('id', requestId)
                .eq('therapist_id', user.id)
                .select()
                .single();

            // Create a booking record
            if (request) {
                await supabase.from('therapist_bookings').insert({
                    user_id: request.user_id,
                    therapist_id: user.id,
                    therapist_name: 'Dr. ' + (user.user_metadata?.full_name || 'Therapist'), // Simplify for now
                    scheduled_at: request.preferred_time || new Date().toISOString(),
                    duration_minutes: 50,
                    session_type: 'video',
                    status: 'scheduled',
                    notes: request.issue_summary
                });
            }
        } else if (action === 'decline') {
            await supabase
                .from('therapist_session_requests')
                .update({ status: 'declined', notes })
                .eq('id', requestId)
                .eq('therapist_id', user.id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Therapist Dashboard Action Error:', error);
        return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
    }
}
