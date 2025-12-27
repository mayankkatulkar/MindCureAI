import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
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

        const { therapistId, sessionType, notes, scheduledAt } = await request.json();

        if (!therapistId) {
            return NextResponse.json(
                { error: 'Therapist ID is required' },
                { status: 400 }
            );
        }

        // Get therapist details including price
        const { data: therapist, error: therapistError } = await supabase
            .from('therapists')
            .select('id, hourly_rate, profile:profiles(full_name, email)')
            .eq('id', therapistId)
            .single();

        if (therapistError || !therapist) {
            return NextResponse.json(
                { error: 'Therapist not found' },
                { status: 404 }
            );
        }

        // Handle the profile data
        const profileData = therapist.profile as any;
        const therapistName = Array.isArray(profileData)
            ? profileData[0]?.full_name
            : profileData?.full_name || 'Therapist';

        const hourlyRate = therapist.hourly_rate || 100; // Default $100 if not set
        const priceInCents = Math.round(hourlyRate * 100);

        // Create session request first (with pending payment status)
        const { data: sessionRequest, error: sessionError } = await supabase
            .from('therapist_session_requests')
            .insert({
                user_id: user.id,
                therapist_id: therapistId,
                urgency: 'normal',
                issue_summary: notes || null,
                preferred_time: scheduledAt || null,
                status: 'pending',
                // Note: You may need to add this column to your schema
                // payment_status: 'pending'
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Error creating session request:', sessionError);
            return NextResponse.json(
                { error: 'Failed to create session request' },
                { status: 500 }
            );
        }

        // Get or create Stripe customer
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = subscription?.stripe_customer_id;

        const stripe = getStripe();

        if (!customerId) {
            const customer = await stripe.customers.create({
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

        // Create Stripe checkout session for one-time payment
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Therapy Session with ${therapistName}`,
                            description: `${sessionType || 'Video'} session - 50 minutes`,
                        },
                        unit_amount: priceInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/therapist-video?session=${sessionRequest.id}&success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/therapist-directory?canceled=true`,
            metadata: {
                supabase_user_id: user.id,
                therapist_id: therapistId,
                session_request_id: sessionRequest.id,
                type: 'therapist_session',
            },
        });

        return NextResponse.json({
            url: checkoutSession.url,
            sessionRequestId: sessionRequest.id,
        });

    } catch (error) {
        console.error('Therapist checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
