import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/support-groups
 * List all active support groups
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: groups, error } = await supabase
            .from('support_groups')
            .select('*')
            .eq('is_active', true)
            .order('member_count', { ascending: false });

        if (error) {
            console.error('Error fetching support groups:', error);
            // Return default groups if table doesn't exist yet
            return NextResponse.json({
                groups: [
                    { id: '1', name: 'Anxiety Support Circle', description: 'A safe space to share and overcome anxiety together', topics: ['Anxiety', 'Stress'], member_count: 24, meeting_schedule: 'Daily 7PM EST' },
                    { id: '2', name: 'Depression Warriors', description: 'Supporting each other through difficult times', topics: ['Depression', 'Mood'], member_count: 18, meeting_schedule: 'Mon, Wed, Fri 6PM EST' },
                    { id: '3', name: 'Mindfulness & Meditation', description: 'Learn and practice mindfulness techniques together', topics: ['Mindfulness', 'Meditation'], member_count: 32, meeting_schedule: 'Tue, Thu 8PM EST' },
                ]
            });
        }

        return NextResponse.json({ groups: groups || [] });

    } catch (error) {
        console.error('Support groups error:', error);
        return NextResponse.json({ groups: [] });
    }
}

/**
 * POST /api/support-groups
 * Join a support group
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { groupId, action } = await request.json();

        if (action === 'join') {
            // Add user to group
            const { error } = await supabase
                .from('support_group_members')
                .insert({
                    group_id: groupId,
                    user_id: user.id
                });

            if (error && !error.message.includes('duplicate')) {
                throw error;
            }

            // Increment member count
            await supabase.rpc('increment_group_member_count', { p_group_id: groupId });

            return NextResponse.json({ success: true, message: 'Joined group successfully' });

        } else if (action === 'leave') {
            // Remove user from group
            await supabase
                .from('support_group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', user.id);

            // Decrement member count
            await supabase.rpc('decrement_group_member_count', { p_group_id: groupId });

            return NextResponse.json({ success: true, message: 'Left group successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Support group action error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
