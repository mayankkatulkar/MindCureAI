'use client';

import { usePathname } from 'next/navigation';
import { SidebarNav } from './sidebar-nav';

export function ConditionalHeader() {
  const pathname = usePathname();

  // Don't show navigation on landing page and auth pages as they have their own
  const hideNav = pathname === '/landing' || pathname === '/login' || pathname === '/signup';

  if (hideNav) {
    return null;
  }

  return <SidebarNav />;
}
