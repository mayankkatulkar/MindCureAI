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
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!subscription?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No billing account found' },
                { status: 400 }
            );
        }

        const session = await getStripe().billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Billing portal error:', error);
        return NextResponse.json(
            { error: 'Failed to create billing portal session' },
            { status: 500 }
        );
    }
}
