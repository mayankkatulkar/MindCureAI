import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialize Supabase admin client to avoid build-time errors
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdminInstance) {
        supabaseAdminInstance = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return supabaseAdminInstance;
}

export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json(
            { error: 'Missing signature or webhook secret' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                const planType = session.metadata?.plan_type;
                const sessionType = session.metadata?.type;

                // Handle subscription checkout
                if (userId && planType) {
                    await getSupabaseAdmin()
                        .from('subscriptions')
                        .update({
                            stripe_subscription_id: session.subscription as string,
                            plan_type: planType,
                            status: 'active',
                            current_period_start: new Date().toISOString(),
                        })
                        .eq('user_id', userId);
                }

                // Handle therapist session payment
                if (sessionType === 'therapist_session') {
                    const sessionRequestId = session.metadata?.session_request_id;
                    const therapistId = session.metadata?.therapist_id;

                    if (sessionRequestId) {
                        // Update session request with payment status
                        await getSupabaseAdmin()
                            .from('therapist_session_requests')
                            .update({
                                status: 'accepted',
                                // payment_status: 'paid', // Uncomment after adding column to schema
                                // stripe_payment_intent_id: session.payment_intent as string,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', sessionRequestId);

                        console.log(`Therapist session payment completed: ${sessionRequestId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const { data: existingSub } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (existingSub) {
                    const periodEnd = (subscription as any).current_period_end;
                    await getSupabaseAdmin()
                        .from('subscriptions')
                        .update({
                            status: subscription.status === 'active' ? 'active' : subscription.status,
                            cancel_at_period_end: subscription.cancel_at_period_end,
                            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                        })
                        .eq('user_id', existingSub.user_id);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const { data: existingSub } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (existingSub) {
                    await getSupabaseAdmin()
                        .from('subscriptions')
                        .update({
                            plan_type: 'free',
                            status: 'canceled',
                            stripe_subscription_id: null,
                        })
                        .eq('user_id', existingSub.user_id);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const { data: existingSub } = await getSupabaseAdmin()
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (existingSub) {
                    await getSupabaseAdmin()
                        .from('subscriptions')
                        .update({ status: 'past_due' })
                        .eq('user_id', existingSub.user_id);
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
