import type { NextConfig } from 'next';
import { PROJECT_IMAGE_ORIGIN } from './lib/projects/images';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [new URL(`${PROJECT_IMAGE_ORIGIN}/images/projects/**`)],
  },
  redirects: async () => [
    {
      source: '/images/projects/:path*',
      destination: `${PROJECT_IMAGE_ORIGIN}/images/projects/:path*`,
      permanent: false,
    },
    {
      source: '/og-image.png',
      destination: '/opengraph-image',
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
    {
      source: '/(.*)\\.(js|css|woff2|png|jpg|jpeg|gif|ico|svg)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

export default nextConfig;
