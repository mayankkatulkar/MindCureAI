import { NextResponse } from 'next/server';
import { getStripe, PLANS, PlanType } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { planType } = await request.json() as { planType: PlanType };

        if (!planType || !PLANS[planType]) {
            return NextResponse.json(
                { error: 'Invalid plan type' },
                { status: 400 }
            );
        }

        const plan = PLANS[planType];

        if (!plan.priceId) {
            return NextResponse.json(
                { error: 'Free plan does not require checkout' },
                { status: 400 }
            );
        }

        // Get or create Stripe customer
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = subscription?.stripe_customer_id;

        if (!customerId) {
            const customer = await getStripe().customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            // Update subscription record with Stripe customer ID
            await supabase
                .from('subscriptions')
                .update({ stripe_customer_id: customerId })
                .eq('user_id', user.id);
        }

        // Create checkout session
        const session = await getStripe().checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
            metadata: {
                supabase_user_id: user.id,
                plan_type: planType,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
