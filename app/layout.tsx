import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GoogleAnalytics } from '@next/third-parties/google';
import { getSiteUrl } from '@/lib/seo/url';
import './globals.css';

const pretendard = localFont({
  src: [
    {
      path: '../node_modules/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../node_modules/pretendard/dist/web/static/woff2/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../node_modules/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../node_modules/pretendard/dist/web/static/woff2/Pretendard-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.GA_MEASUREMENT_ID;

  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">
        {children}
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
