import Stripe from 'stripe';

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not set');
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-11-17.clover',
            typescript: true,
        });
    }
    return stripeInstance;
}

// For backwards compatibility - only access at runtime
export const stripe = {
    get instance() {
        return getStripe();
    }
};

export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: [
            '5 AI therapy sessions/month',
            'Basic mood tracking',
            'Community support access',
            'Crisis resources',
        ],
    },
    pro: {
        name: 'Pro',
        price: 1900, // $19.00 in cents
        priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
        features: [
            'Unlimited AI therapy sessions',
            'Advanced mood analytics',
            'Therapist directory access',
            'Priority support',
            'Session recordings',
            'Progress reports',
        ],
    },
    enterprise: {
        name: 'Enterprise',
        price: 4900, // $49.00 in cents
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
        features: [
            'Everything in Pro',
            '2 Therapist video sessions/month',
            'Custom wellness programs',
            'Dedicated support',
            'Team management (5 users)',
            'API access',
        ],
    },
} as const;

export type PlanType = keyof typeof PLANS;
