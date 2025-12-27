import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Check if user can start a voice AI session
 * - Free users get 5 sessions total
 * - Pro/Enterprise users get unlimited
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create subscription record
        let { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Create default free subscription if none exists
        if (!subscription) {
            const { data: newSub, error: insertError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    plan_type: 'free',
                    status: 'active',
                    sessions_used: 0,
                    session_limit: 5
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating subscription:', insertError);
                // Still allow the session for now
                return NextResponse.json({
                    canStart: true,
                    sessionsRemaining: 5,
                    sessionsUsed: 0,
                    planType: 'free',
                    isUnlimited: false
                });
            }
            subscription = newSub;
        }

        const isUnlimited = subscription.plan_type === 'pro' || subscription.plan_type === 'enterprise';
        const sessionsUsed = subscription.sessions_used || 0;
        const sessionLimit = subscription.session_limit || 5;
        const sessionsRemaining = isUnlimited ? 999 : Math.max(0, sessionLimit - sessionsUsed);
        const canStart = isUnlimited || sessionsRemaining > 0;

        return NextResponse.json({
            canStart,
            sessionsRemaining,
            sessionsUsed,
            planType: subscription.plan_type,
            isUnlimited
        });

    } catch (error) {
        console.error('Session check error:', error);
        // Default allow on error to not block users
        return NextResponse.json({
            canStart: true,
            sessionsRemaining: 5,
            sessionsUsed: 0,
            planType: 'free',
            isUnlimited: false
        });
    }
}

/**
 * Increment session count after a session ends
 */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Increment sessions_used
        const { data, error } = await supabase.rpc('increment_session_count', {
            p_user_id: user.id
        });

        // Fallback if RPC doesn't exist
        if (error) {
            // Manual increment
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('sessions_used')
                .eq('user_id', user.id)
                .single();

            if (sub) {
                await supabase
                    .from('subscriptions')
                    .update({ sessions_used: (sub.sessions_used || 0) + 1 })
                    .eq('user_id', user.id);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Session increment error:', error);
        return NextResponse.json({ error: 'Failed to update session count' }, { status: 500 });
    }
}
