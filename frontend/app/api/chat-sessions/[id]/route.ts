import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE - Delete a chat session
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Security: Ensure user owns the session

        if (error) {
            console.error('Error deleting session:', error);
            return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Chat session DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
