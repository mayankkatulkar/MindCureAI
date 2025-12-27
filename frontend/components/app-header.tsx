'use client';

import Link from 'next/link';
import { FileUp, Home, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigationItems = [
    { href: '/landing', icon: <Home className="h-4 w-4" />, label: 'Home' },
    { href: '/voice-chat', icon: '🤖', label: 'AI Voice Chat' },
    { href: '/file-upload', icon: <FileUp className="h-4 w-4" />, label: 'Upload' },
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/peer-support', icon: '🤝', label: 'Peer Support' },
    { href: '/productivity-center', icon: '⚡', label: 'Productivity' },
    { href: '/therapist-directory', icon: '👩‍⚕️', label: 'Find Therapist' },
    { href: '/crisis-support', icon: '🚨', label: 'Crisis Support', isEmergency: true },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
    { href: '/logout', icon: '🚪', label: 'Logout', isLogout: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">💜</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground leading-none">
                MindCure
              </h1>
              <span className="text-xs text-muted-foreground leading-none">Mental Wellness Platform</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105",
                  pathname === item.href
                    ? item.isEmergency
                      ? "bg-red-500 text-white shadow-md"
                      : item.isLogout
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-primary text-primary-foreground shadow-md"
                    : item.isEmergency
                      ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                      : item.isLogout
                        ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <span className="flex-shrink-0 text-sm">
                  {typeof item.icon === 'string' ? item.icon : item.icon}
                </span>
                <span className="hidden xl:inline text-xs">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 py-2">
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center space-y-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors",
                    pathname === item.href
                      ? item.isEmergency
                        ? "bg-red-500 text-white"
                        : item.isLogout
                          ? "bg-orange-500 text-white"
                          : "bg-primary text-primary-foreground"
                      : item.isEmergency
                        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                        : item.isLogout
                          ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <span className="flex-shrink-0">
                    {typeof item.icon === 'string' ? item.icon : item.icon}
                  </span>
                  <span className="text-xs text-center leading-none">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
