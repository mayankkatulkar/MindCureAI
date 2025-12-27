import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { ApplyThemeScript, ThemeToggle } from '@/components/theme-toggle';
import { AppHeader } from '@/components/app-header';
import { ConditionalHeader } from '@/components/conditional-header';
import { getAppConfig } from '@/lib/utils';
import './globals.css';

const publicSans = localFont({
  src: [
    {
      path: '../public/font/Public_Sans/PublicSans-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../public/font/Public_Sans/PublicSans-Italic-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-public-sans',
  display: 'swap',
});

const commitMono = localFont({
  src: [
    {
      path: './fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-commit-mono',
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const hdrs = await headers();
  const { accent, accentDark, pageTitle, pageDescription } = await getAppConfig(hdrs);

  const styles = [
    accent ? `:root { --primary: ${accent}; }` : '',
    accentDark ? `.dark { --primary: ${accentDark}; }` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <ApplyThemeScript />
        {styles && <style>{styles}</style>}
        {/* Live2D Cubism 4 Core - Required for Live2D avatars */}
        <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js" />
      </head>
      <body className={`${publicSans.className} antialiased`}>
        <ConditionalHeader />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
