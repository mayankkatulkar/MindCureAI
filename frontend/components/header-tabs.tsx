'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'SwipeSmart', href: '/', current: true },
  { name: 'File Upload', href: '/file-upload', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function HeaderTabs() {
  const pathname = usePathname();

  const tabsWithCurrent = tabs.map((tab) => ({
    ...tab,
    current: pathname === tab.href,
  }));

  return (
    <div className="fixed top-4 left-1/2 z-[9999] -translate-x-1/2">
      <div className="relative">
        {/* Glass morphism container */}
        <div className="rounded-2xl border border-gray-300 bg-white/10 px-6 py-3 shadow-2xl backdrop-blur-md">
          <div className="hidden sm:block">
            <nav aria-label="Tabs" className="flex items-center space-x-8">
              {tabsWithCurrent.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  aria-current={tab.current ? 'page' : undefined}
                  className={classNames(
                    tab.current
                      ? 'rounded-lg bg-black px-4 py-2 font-medium text-cyan-500 shadow-lg transition-all duration-200'
                      : 'rounded-lg border border-gray-400 px-4 py-2 font-medium text-black transition-all duration-200 hover:bg-black hover:text-white',
                    'group inline-flex items-center text-sm'
                  )}
                >
                  <span>{tab.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile dropdown */}
          <div className="sm:hidden">
            <select
              value={tabsWithCurrent.find((tab) => tab.current)?.name}
              onChange={(e) => {
                const selectedTab = tabsWithCurrent.find((tab) => tab.name === e.target.value);
                if (selectedTab) {
                  window.location.href = selectedTab.href;
                }
              }}
              aria-label="Select a tab"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-md focus:ring-2 focus:ring-white/30 focus:outline-none"
            >
              {tabsWithCurrent.map((tab) => (
                <option key={tab.name} className="bg-gray-800 text-white">
                  {tab.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"></div>
      </div>
    </div>
  );
}
