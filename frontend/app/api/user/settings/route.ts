import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user profile with preferences
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

        // Fetch subscription info
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        return NextResponse.json({
            profile,
            subscription,
            email: user.email,
        });
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { profile, notifications, privacy, security } = body;

        // Update profile in Supabase
        const updateData: Record<string, any> = {};

        if (profile) {
            if (profile.name) updateData.full_name = profile.name;
            if (profile.phone !== undefined) updateData.phone = profile.phone;
            if (profile.location !== undefined) updateData.location = profile.location;
            if (profile.timezone !== undefined) updateData.timezone = profile.timezone;
            if (profile.therapyPreference) updateData.preferred_therapy_type = profile.therapyPreference;
            if (profile.mentalHealthGoals) updateData.mental_health_goals = profile.mentalHealthGoals;
            if (profile.currentChallenges) updateData.current_challenges = profile.currentChallenges;

            // AI preferences
            if (profile.preferredVoice) updateData.preferred_voice = profile.preferredVoice;
            if (profile.genzMode !== undefined) updateData.genz_mode = profile.genzMode;
        }

        if (notifications) {
            if (notifications.email !== undefined) updateData.notification_email = notifications.email;
            if (notifications.sms !== undefined) updateData.notification_sms = notifications.sms;
        }

        if (privacy) {
            if (privacy.anonymousPeerSupport !== undefined) updateData.privacy_anonymous = privacy.anonymousPeerSupport;
        }

        // Only update if there are fields to update
        if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString();

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (updateError) {
                console.error('Profile update error:', updateError);
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
            }
        }

        // Fetch updated profile
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully',
            profile: updatedProfile,
        });
    } catch (error) {
        console.error('Settings PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
