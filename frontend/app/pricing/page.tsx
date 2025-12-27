'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';

const PLANS = {
    free: {
        name: 'BYOK Free',
        price: 0,
        period: '/month',
        description: 'Bring your own Gemini API key',
        features: [
            '5 AI therapy sessions/month',
            'Your own Gemini API key (~$0.10/session)',
            'Basic mood tracking',
            'Peer support access',
            'Crisis resources',
        ],
        cta: 'Get Started Free',
        popular: false,
        icon: '🌱'
    },
    pro: {
        name: 'BYOK Pro',
        price: 9.99,
        period: '/month',
        description: 'Unlimited sessions with your key',
        features: [
            'Unlimited AI therapy sessions',
            'Your own Gemini API key',
            'Advanced mood analytics',
            'Therapist directory access',
            'Session summaries',
            'Priority support',
        ],
        cta: 'Upgrade to Pro',
        popular: true,
        icon: '⭐'
    },
    premium: {
        name: 'Premium+',
        price: 19.99,
        period: '/month',
        description: 'No key needed - we handle everything',
        features: [
            'Everything in Pro',
            'WE provide Gemini API key',
            '1 Therapist video session/month',
            'Custom wellness programs',
            'Dedicated support',
            'Ad-free experience',
        ],
        cta: 'Go Premium+',
        popular: false,
        icon: '🚀'
    },
};

export default function PricingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSelectPlan = async (planType: string) => {
        if (planType === 'free') {
            router.push('/signup');
            return;
        }

        if (planType === 'premium') {
            // Premium+ subscribers get white-glove onboarding
            window.location.href = 'mailto:support@mindcure.ai?subject=Premium+ Subscription';
            return;
        }

        setIsLoading(planType);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else if (data.error === 'Unauthorized') {
                router.push(`/login?redirect=/pricing`);
            } else {
                alert(data.error || 'Failed to start checkout');
            }
        } catch (error) {
            alert('Failed to process request. Please try again.');
        }

        setIsLoading(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
            <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Choose Your Wellness Plan
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start your mental wellness journey with the plan that fits your needs. All plans include our core AI therapy features.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
                    {Object.entries(PLANS).map(([key, plan], index) => (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative group ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div
                                className={`h-full rounded-2xl p-6 lg:p-8 transition-all duration-300 ${plan.popular
                                    ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-pink-700 text-white shadow-2xl shadow-purple-500/25 scale-105'
                                    : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:-translate-y-1'
                                    }`}
                            >
                                {/* Plan Header */}
                                <div className="text-center mb-6">
                                    <span className="text-4xl mb-4 block">{plan.icon}</span>
                                    <h2 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-foreground'}`}>
                                        {plan.name}
                                    </h2>
                                    <p className={`text-sm ${plan.popular ? 'text-purple-200' : 'text-muted-foreground'}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="text-center mb-6">
                                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>
                                        ${plan.price}
                                    </span>
                                    <span className={plan.popular ? 'text-purple-200' : 'text-muted-foreground'}>
                                        {plan.period}
                                    </span>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className={`text-lg flex-shrink-0 ${plan.popular ? 'text-purple-200' : 'text-green-500'}`}>
                                                ✓
                                            </span>
                                            <span className={plan.popular ? 'text-purple-100' : 'text-muted-foreground'}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleSelectPlan(key)}
                                    disabled={isLoading === key}
                                    className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular
                                        ? 'bg-white text-purple-600 hover:bg-purple-50 shadow-lg'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                                        }`}
                                >
                                    {isLoading === key ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : plan.cta}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-3xl mx-auto mb-12"
                >
                    <h2 className="text-2xl font-bold text-center text-foreground mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                            <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
                            <p className="text-muted-foreground">
                                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                            </p>
                        </div>
                        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                            <h3 className="font-semibold text-foreground mb-2">Is my data secure?</h3>
                            <p className="text-muted-foreground">
                                Absolutely. We use end-to-end encryption and never store your therapy conversations. Your privacy is our top priority.
                            </p>
                        </div>
                        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                            <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
                            <p className="text-muted-foreground">
                                We accept all major credit cards, debit cards, and offer payment through Stripe for secure transactions.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <p className="text-muted-foreground">
                        Not sure yet?{' '}
                        <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                            Start with our free plan
                        </Link>
                        {' '}and upgrade anytime.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
