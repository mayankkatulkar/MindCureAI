'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { createClient } from '@/lib/supabase/client';

interface Subscription {
    plan_type: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

const PLAN_DETAILS = {
    free: { name: 'Free', price: 0, color: 'gray' },
    pro: { name: 'Pro', price: 19, color: 'purple' },
    enterprise: { name: 'Enterprise', price: 49, color: 'gold' },
};

export default function BillingPage() {
    const router = useRouter();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCanceling, setIsCanceling] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login?redirect=/billing');
                return;
            }

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSubscription(data);
            }
            setIsLoading(false);
        };

        fetchSubscription();
    }, [supabase, router]);

    const handleManageSubscription = async () => {
        try {
            const response = await fetch('/api/billing/portal', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            alert('Failed to open billing portal');
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
            return;
        }

        setIsCanceling(true);
        try {
            const response = await fetch('/api/billing/cancel', {
                method: 'POST',
            });

            if (response.ok) {
                const { data } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .single();
                setSubscription(data);
            }
        } catch (error) {
            alert('Failed to cancel subscription');
        }
        setIsCanceling(false);
    };

    if (isLoading) {
        return (
            <>
                <AppHeader />
                <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                </div>
            </>
        );
    }

    const planInfo = subscription?.plan_type
        ? PLAN_DETAILS[subscription.plan_type as keyof typeof PLAN_DETAILS]
        : PLAN_DETAILS.free;

    return (
        <>
            <AppHeader />
            <div className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

                    {/* Current Plan Card */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-200 text-sm mb-1">Current Plan</p>
                                <h2 className="text-3xl font-bold">{planInfo.name}</h2>
                                <p className="text-purple-100 mt-2">
                                    {planInfo.price === 0 ? 'Free forever' : `$${planInfo.price}/month`}
                                </p>
                            </div>
                            <div className="text-right">
                                {subscription?.status === 'active' && (
                                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-sm">
                                        <span className="w-2 h-2 rounded-full bg-green-400" />
                                        Active
                                    </span>
                                )}
                                {subscription?.cancel_at_period_end && (
                                    <p className="text-yellow-200 text-sm mt-2">
                                        Cancels on {new Date(subscription.current_period_end!).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {subscription?.plan_type !== 'free' && subscription?.current_period_end && (
                            <div className="mt-6 pt-6 border-t border-purple-400/30">
                                <p className="text-purple-200 text-sm">
                                    Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        {subscription?.plan_type === 'free' ? (
                            <Link
                                href="/pricing"
                                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors"
                            >
                                <span>🚀</span>
                                Upgrade to Pro
                            </Link>
                        ) : (
                            <button
                                onClick={handleManageSubscription}
                                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 py-4 px-6 rounded-xl font-semibold transition-colors"
                            >
                                <span>💳</span>
                                Manage Payment Method
                            </button>
                        )}

                        <Link
                            href="/pricing"
                            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 py-4 px-6 rounded-xl font-semibold transition-colors"
                        >
                            <span>📋</span>
                            View All Plans
                        </Link>
                    </div>

                    {/* Subscription Stats */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
                        <h3 className="font-semibold mb-4">Usage This Month</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">12</p>
                                <p className="text-sm text-muted-foreground">AI Sessions</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">45</p>
                                <p className="text-sm text-muted-foreground">Minutes Used</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">+15%</p>
                                <p className="text-sm text-muted-foreground">Wellness Improvement</p>
                            </div>
                        </div>
                    </div>

                    {/* Cancel Subscription */}
                    {subscription?.plan_type !== 'free' && !subscription?.cancel_at_period_end && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                            <h3 className="font-semibold mb-2 text-red-600">Cancel Subscription</h3>
                            <p className="text-muted-foreground mb-4">
                                If you cancel, you'll still have access until the end of your current billing period.
                            </p>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                                className="text-red-600 hover:text-red-700 underline text-sm disabled:opacity-50"
                            >
                                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
