import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stock Research Agent - Educational Stock Analysis Tool',
  description: 'AI-powered multi-agent educational stock analysis tool. For informational purposes only - not investment advice.',
  appleWebApp: { capable: true, title: 'Stock Agent', statusBarStyle: 'black-translucent' },
};

// viewportFit 'cover' lets the page extend under the iPhone Dynamic Island / home indicator;
// globals.css pads content back in with env(safe-area-inset-*).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#120a24',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
