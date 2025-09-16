import { redirect } from 'next/navigation';

export default function Page() {
  // Redirect to the landing page as the main entry point
  redirect('/landing');
}