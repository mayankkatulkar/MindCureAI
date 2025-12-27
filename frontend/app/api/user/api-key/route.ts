import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Save/update user's Gemini API key
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { apiKey } = await request.json();

        // Validate the key format
        if (!apiKey?.startsWith('AIza') || apiKey.length < 30) {
            return NextResponse.json({
                error: 'Invalid API key format. Gemini keys start with "AIza"'
            }, { status: 400 });
        }

        // Test the key with Gemini API
        try {
            const testResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );
            if (!testResponse.ok) {
                const errorData = await testResponse.json().catch(() => ({}));
                return NextResponse.json({
                    error: 'Invalid API key. Please check your key and try again.',
                    details: errorData.error?.message
                }, { status: 400 });
            }
        } catch (e) {
            return NextResponse.json({
                error: 'Could not validate API key. Please try again.'
            }, { status: 400 });
        }

        // Store encrypted key in Supabase
        // Note: We're storing the key directly here - in production, 
        // consider using Supabase Vault or pgcrypto for encryption
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                encrypted_gemini_key: apiKey, // Store directly for now
                api_key_added_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to store API key:', updateError);
            return NextResponse.json({
                error: 'Failed to save API key'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'API key saved successfully! You can now use voice AI.'
        });

    } catch (error) {
        console.error('API key save error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove user's API key
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                encrypted_gemini_key: null,
                api_key_added_at: null
            })
            .eq('id', user.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to remove API key' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'API key removed'
        });

    } catch (error) {
        console.error('API key delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET - Check if user has API key configured
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('encrypted_gemini_key, api_key_added_at, subscription_tier')
            .eq('id', user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

        // Check session usage for this month
        const { data: sessionData } = await supabase
            .rpc('can_start_session', { p_user_id: user.id });

        return NextResponse.json({
            hasApiKey: !!profile?.encrypted_gemini_key,
            apiKeyAddedAt: profile?.api_key_added_at,
            subscriptionTier: profile?.subscription_tier || 'byok_free',
            sessionInfo: sessionData || {
                allowed: false,
                current_count: 0,
                limit: 5,
                remaining: 5
            }
        });

    } catch (error) {
        console.error('API key check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
