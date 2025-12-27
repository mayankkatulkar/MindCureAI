import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!subscription?.stripe_subscription_id) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 400 }
            );
        }

        // Cancel at period end instead of immediately
        await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        // Update local database
        await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: true })
            .eq('user_id', user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
