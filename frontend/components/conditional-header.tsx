'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './app-header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on landing page and auth pages as they have their own navigation
  const hideHeader = pathname === '/landing' || pathname === '/login' || pathname === '/signup';
  
  if (hideHeader) {
    return null;
  }
  
  return <AppHeader />;
}
