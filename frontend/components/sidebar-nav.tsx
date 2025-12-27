'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    isEmergency?: boolean;
}

const navItems: NavItem[] = [
    { href: '/voice-chat', label: 'AI Therapy', icon: <VoiceIcon /> },
    { href: '/peer-support', label: 'Peer Support', icon: <PeerIcon /> },
    { href: '/therapist-directory', label: 'Find Therapist', icon: <TherapistIcon /> },
    { href: '/pricing', label: 'Pricing', icon: <PricingIcon /> },
    { href: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    { href: '/crisis-support', label: 'Crisis Help', icon: <CrisisIcon />, isEmergency: true },
];

function VoiceIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
    );
}

function PeerIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function TherapistIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
            <path d="M12 3v6" />
        </svg>
    );
}

function PricingIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 18V6" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function CrisisIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
    );
}

// Premium MindCure Logo - Big Tech Style
export function MindCureLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
    const sizes = {
        small: { icon: 32, text: 'text-lg', sub: 'text-[9px]' },
        default: { icon: 40, text: 'text-xl', sub: 'text-[10px]' },
        large: { icon: 56, text: 'text-3xl', sub: 'text-xs' },
    };
    const s = sizes[size];

    return (
        <Link href="/landing" className="flex items-center gap-3 group">
            {/* Premium Logo Mark */}
            <div
                className="relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg"
                style={{ width: s.icon, height: s.icon }}
            >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500" />

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent" />

                {/* Minimalist "M" + Mind Symbol */}
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    className="relative z-10"
                    style={{ width: s.icon * 0.65, height: s.icon * 0.65 }}
                >
                    {/* Abstract brain/mind curves */}
                    <path
                        d="M10 28V16C10 11 14 8 20 8C26 8 30 11 30 16V28"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M15 28V18C15 15 17 13 20 13C23 13 25 15 25 18V28"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <circle cx="20" cy="18" r="2" fill="white" />
                </svg>
            </div>

            {/* Logo Text */}
            <div className="flex flex-col leading-tight">
                <span className={cn(
                    "font-bold tracking-tight text-foreground transition-colors group-hover:text-purple-500",
                    s.text
                )}>
                    MindCure
                </span>
                <span className={cn(
                    "uppercase tracking-[0.2em] text-muted-foreground font-semibold",
                    s.sub
                )}>
                    AI Wellness
                </span>
            </div>
        </Link>
    );
}

export function SidebarNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close sidebar when navigating
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    if (!isMounted) return null;

    return (
        <>
            {/* Floating Menu Button - Always Visible */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed top-4 left-4 z-[100] p-3 rounded-xl",
                    "bg-background/80 backdrop-blur-xl border border-border/50",
                    "shadow-lg shadow-black/5",
                    "hover:bg-accent/50 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <CloseIcon />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <MenuIcon />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            "fixed top-0 left-0 z-[95] h-full w-72",
                            "bg-background/95 backdrop-blur-2xl",
                            "border-r border-border/50",
                            "shadow-2xl shadow-black/10",
                            "flex flex-col"
                        )}
                    >
                        {/* Logo Section */}
                        <div className="p-6 pt-20 border-b border-border/50">
                            <MindCureLogo size="default" />
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navItems.map((item, index) => {
                                const isActive = pathname === item.href;
                                return (
                                    <motion.div
                                        key={item.href}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl",
                                                "text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? item.isEmergency
                                                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                                        : "bg-primary/10 text-primary border border-primary/20"
                                                    : item.isEmergency
                                                        ? "text-red-400 hover:bg-red-500/5 hover:text-red-500"
                                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            <span className={cn(
                                                "flex-shrink-0",
                                                isActive && !item.isEmergency && "text-primary",
                                                item.isEmergency && "text-red-400"
                                            )}>
                                                {item.icon}
                                            </span>
                                            <span>{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeIndicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-current"
                                                />
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-border/50">
                            <Link
                                href="/logout"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" x2="9" y1="12" y2="12" />
                                </svg>
                                <span>Sign Out</span>
                            </Link>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
