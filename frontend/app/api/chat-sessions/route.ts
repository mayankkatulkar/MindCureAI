import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all chat sessions for the current user
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        // For unauthenticated users, return empty sessions (not an error)
        if (authError || !user) {
            console.log('Chat sessions: User not authenticated, returning empty');
            return NextResponse.json({ sessions: [], authenticated: false });
        }

        const { data: sessions, error } = await supabase
            .from('chat_sessions')
            .select('id, title, summary, voice_used, genz_mode, duration_seconds, mood_before, mood_after, created_at, transcript, metadata')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching sessions:', error);
            // If table doesn't exist yet, return empty
            if (error.message?.includes('does not exist')) {
                return NextResponse.json({ sessions: [], tableExists: false });
            }
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
        }

        return NextResponse.json({ sessions: sessions || [], authenticated: true });
    } catch (error) {
        console.error('Chat sessions GET error:', error);
        return NextResponse.json({ sessions: [], error: 'Internal server error' });
    }
}

// POST - Create a new chat session
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title = 'New Session',
            voice_used = 'Kore',
            genz_mode = false,
            mood_before,
        } = body;

        const { data: session, error } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: user.id,
                title,
                voice_used,
                genz_mode,
                mood_before,
                duration_seconds: body.duration_seconds || 0,
                transcript: body.transcript || [],
                metadata: body.metadata || {},
                mood_after: body.mood_after,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating session:', error);
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Chat sessions POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// PATCH - Update an existing session (e.g. adding analysis)
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, metadata, transcript } = body;

        if (!id) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const updateData: any = {};
        if (metadata) updateData.metadata = metadata;
        if (transcript) updateData.transcript = transcript;

        const { data: session, error } = await supabase
            .from('chat_sessions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating session:', error);
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Chat sessions PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
