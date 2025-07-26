// Trusted Types loaded lazily on desktop (see below)
import type React from 'react';
import ClientLayout from './ClientLayout';
import '../styles/globals.css';
import '../styles/mobile-fixes.css';
import { Inter } from 'next/font/google';
import { MobileNavigation } from '@/components/mobile-navigation';
import { useMobile } from '@/hooks/use-mobile';
import '@/styles/tokens.css';
import '@/styles/typography.css';
import PageTransition from '@/components/ui/page-transition';
import ViewportFix from '@/components/ViewportFix';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'CrazyCube - NFT Platform',
  description: 'Where cubes cry and joke!',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
    ],
    apple: [
      { url: '/icons/favicon-180x180.png', sizes: '180x180' },
      { url: '/icons/favicon-152x152.png', sizes: '152x152' },
      { url: '/icons/favicon-120x120.png', sizes: '120x120' },
      { url: '/icons/favicon-114x114.png', sizes: '114x114' },
      { url: '/icons/favicon-76x76.png', sizes: '76x76' },
      { url: '/icons/favicon-60x60.png', sizes: '60x60' },
      { url: '/icons/favicon-57x57.png', sizes: '57x57' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icons/favicon-152x152.png',
      },
    ],
  },
  generator: 'v0.dev',
  other: {
    'next-head-count': '0',
  },
};

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        />
        <link rel='manifest' href='/manifest.json' />
        {/* Prevent mobile browser issues */}
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
      </head>
      <body className={inter.className}>
              {/* moved to ViewportFix component */}
      <ViewportFix />
<ClientLayout>
          <PageTransition>{children}</PageTransition></ClientLayout>
        <MobileNavigation />
      </body>
    </html>
  );
}

export default RootLayout;