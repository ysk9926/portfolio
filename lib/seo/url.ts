import type { SiteConfig } from '@/lib/types/view';

const LOCAL_SITE_URL = 'http://localhost:3000';
const EXAMPLE_HOSTS = new Set(['example.com', 'portfolio.example.com']);

const normalizeOrigin = (rawUrl: string | null | undefined): string | null => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (EXAMPLE_HOSTS.has(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
};

export const getSiteUrl = (siteConfig?: Pick<SiteConfig, 'url'>): string => {
  return (
    normalizeOrigin(process.env.SITE_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(siteConfig?.url) ??
    LOCAL_SITE_URL
  );
};

export const absoluteUrl = (
  pathOrUrl: string,
  siteConfig?: Pick<SiteConfig, 'url'>,
): string => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(path, `${getSiteUrl(siteConfig)}/`).toString();
};

export const absoluteImageUrl = (
  imagePath: string | null | undefined,
  siteConfig?: Pick<SiteConfig, 'url' | 'ogImage'>,
): string => absoluteUrl(imagePath || siteConfig?.ogImage || '/opengraph-image', siteConfig);
