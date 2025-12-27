import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Role-based route definitions
const THERAPIST_ONLY_ROUTES = ['/therapist-dashboard', '/therapist-video'];
const USER_ONLY_ROUTES = ['/voice-chat', '/peer-support', '/eq-evaluation', '/productivity-center'];
const PROTECTED_ROUTES = ['/dashboard', '/settings', '/billing', ...THERAPIST_ONLY_ROUTES, ...USER_ONLY_ROUTES];
const AUTH_ROUTES = ['/login', '/signup'];

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Check route types
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isTherapistRoute = THERAPIST_ONLY_ROUTES.some(route => pathname.startsWith(route));
    const isUserOnlyRoute = USER_ONLY_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname === route);

    // Redirect to login if not authenticated on protected routes
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Role-based authorization for authenticated users
    if (user && (isTherapistRoute || isUserOnlyRoute)) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', user.id)
                .single();

            const isTherapist = profile?.user_type === 'therapist';

            // Redirect non-therapists away from therapist routes
            if (isTherapistRoute && !isTherapist) {
                const url = request.nextUrl.clone();
                url.pathname = '/dashboard';
                return NextResponse.redirect(url);
            }

            // Redirect therapists away from user-only routes to their dashboard
            if (isUserOnlyRoute && isTherapist) {
                const url = request.nextUrl.clone();
                url.pathname = '/therapist-dashboard';
                return NextResponse.redirect(url);
            }
        } catch (error) {
            console.error('Error checking user role:', error);
            // On error, allow access (fail open) but log for debugging
        }
    }

    // Redirect logged-in users away from auth pages based on role
    if (isAuthRoute && user) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', user.id)
                .single();

            const url = request.nextUrl.clone();
            url.pathname = profile?.user_type === 'therapist' ? '/therapist-dashboard' : '/dashboard';
            return NextResponse.redirect(url);
        } catch {
            // Default to regular dashboard on error
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
