import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all verified therapists with their profiles
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Optional filters
        const specialty = searchParams.get('specialty');

        // Build query
        let query = supabase
            .from('therapists')
            .select(`
        id,
        license_number,
        license_state,
        specializations,
        hourly_rate,
        bio,
        years_experience,
        verified,
        availability,
        rating,
        total_sessions,
        profile_image_url,
        accepting_new_clients,
        created_at,
        profile:profiles!inner(
          full_name,
          email,
          avatar_url
        )
      `)
            .eq('verified', true)
            .eq('accepting_new_clients', true)
            .order('rating', { ascending: false });

        // Apply specialty filter if provided
        if (specialty && specialty !== 'all') {
            query = query.contains('specializations', [specialty]);
        }

        const { data: therapists, error } = await query;

        if (error) {
            console.error('Error fetching therapists:', error);
            // Return empty array with message if table doesn't exist or other error
            return NextResponse.json({
                therapists: [],
                total: 0,
                message: 'No therapists available at the moment. Please check back later.',
                error: error.code === 'PGRST205' ? 'Database setup required' : 'Failed to fetch therapists'
            });
        }

        // Transform data for frontend
        const formattedTherapists = (therapists || []).map((t: any) => ({
            id: t.id,
            name: t.profile?.full_name || 'Licensed Therapist',
            email: t.profile?.email,
            specialization: Array.isArray(t.specializations) ? t.specializations.join(', ') : t.specializations || 'General Therapy',
            specializations: t.specializations || [],
            rating: t.rating || 4.5,
            experience: `${t.years_experience || 0} years`,
            yearsExperience: t.years_experience || 0,
            availability: t.availability || 'Contact for availability',
            nextAvailable: determineNextAvailable(t.availability),
            insuranceCovered: true,
            sessionTypes: ['Video', 'Voice'],
            price: t.hourly_rate ? `$${t.hourly_rate}/session` : 'Contact for pricing',
            hourlyRate: t.hourly_rate,
            image: t.profile_image_url || t.profile?.avatar_url || null,
            bio: t.bio || 'Dedicated mental health professional committed to helping you on your wellness journey.',
            licenseNumber: t.license_number,
            licenseState: t.license_state,
            totalSessions: t.total_sessions || 0,
            verified: t.verified
        }));

        return NextResponse.json({
            therapists: formattedTherapists,
            total: formattedTherapists.length
        });

    } catch (error) {
        console.error('Therapist API Error:', error);
        // Return empty array on any error
        return NextResponse.json({
            therapists: [],
            total: 0,
            message: 'Unable to load therapists. Please try again later.'
        });
    }
}

// POST - Book a session with a therapist
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { therapistId, scheduledAt, sessionType, notes, urgency } = body;

        if (!therapistId) {
            return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 });
        }

        // Create session request
        const { data: sessionRequest, error } = await supabase
            .from('therapist_session_requests')
            .insert({
                user_id: user.id,
                therapist_id: therapistId,
                preferred_time: scheduledAt || null,
                urgency: urgency || 'normal',
                issue_summary: notes || null,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating session request:', error);
            return NextResponse.json({ error: 'Failed to create booking request' }, { status: 500 });
        }

        // Also create a booking record if scheduled time is provided
        if (scheduledAt) {
            const { data: therapist } = await supabase
                .from('therapists')
                .select('profile:profiles(full_name)')
                .eq('id', therapistId)
                .single();

            // Handle the profile data which could be an object or array from join
            const profileData = therapist?.profile as any;
            const therapistName = Array.isArray(profileData)
                ? profileData[0]?.full_name
                : profileData?.full_name;

            await supabase
                .from('therapist_bookings')
                .insert({
                    user_id: user.id,
                    therapist_id: therapistId,
                    therapist_name: therapistName || 'Therapist',
                    scheduled_at: scheduledAt,
                    session_type: sessionType || 'video',
                    status: 'scheduled',
                    notes: notes
                });
        }

        return NextResponse.json({
            success: true,
            message: 'Booking request submitted successfully. The therapist will review your request shortly.',
            sessionRequest
        });

    } catch (error) {
        console.error('Booking API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to determine next availability
function determineNextAvailable(availability: any): string {
    if (!availability) return 'next-week';

    // If availability is a JSON object with day slots
    if (typeof availability === 'object') {
        const today = new Date().getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        // Check if available today
        if (availability[days[today]]?.length > 0) return 'today';

        // Check if available tomorrow
        const tomorrow = (today + 1) % 7;
        if (availability[days[tomorrow]]?.length > 0) return 'tomorrow';

        return 'next-week';
    }

    return 'next-week';
}
