import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get real-time count of users waiting in queue
        const { count: onlineCount, error: countError } = await supabase
            .from('peer_matching_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting');

        if (countError) {
            console.error('Error getting online count:', countError);
        }

        // Get recent connections for the current user
        let recentConnections: any[] = [];

        if (user) {
            const { data: connections, error: connectionsError } = await supabase
                .from('peer_connections')
                .select('id, matched_on, status, created_at, last_interaction')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (connectionsError) {
                console.error('Error getting recent connections:', connectionsError);
            } else if (connections) {
                recentConnections = connections.map((conn) => ({
                    id: conn.id,
                    type: conn.matched_on?.length > 0
                        ? `Conversation about ${conn.matched_on.join(', ')}`
                        : 'Peer support conversation',
                    time: formatTimeAgo(new Date(conn.created_at)),
                    status: conn.status,
                    rating: 5 // Default rating, would need a separate ratings table for real ratings
                }));
            }
        }

        return NextResponse.json({
            onlineUsers: onlineCount || 0,
            recentConnections
        });

    } catch (error) {
        console.error('Peer Stats API Error:', error);
        return NextResponse.json({
            onlineUsers: 0,
            recentConnections: []
        });
    }
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}
