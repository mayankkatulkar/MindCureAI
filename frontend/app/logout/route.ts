import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET() {
    const supabase = await createClient();

    // Sign out the user
    await supabase.auth.signOut();

    // Redirect to landing page
    redirect('/landing');
}
