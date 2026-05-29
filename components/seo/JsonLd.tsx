import { HeroData, SiteConfig } from '@/lib/types/view';
import { absoluteUrl, getSiteUrl } from '@/lib/seo/url';
import {
  PROFILE_HANDLE,
  PROFILE_SAME_AS,
  withProfileHandleDescription,
} from '@/lib/seo/profile';

interface JsonLdProps {
  siteConfig: SiteConfig;
  heroData: HeroData;
}

export function PersonJsonLd({ siteConfig, heroData }: JsonLdProps) {
  const siteUrl = getSiteUrl(siteConfig);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: heroData.name,
    alternateName: [PROFILE_HANDLE, `@${PROFILE_HANDLE}`],
    identifier: PROFILE_HANDLE,
    jobTitle: heroData.role,
    url: siteUrl,
    sameAs: PROFILE_SAME_AS,
    knowsAbout: [
      'React',
      'Next.js',
      'TypeScript',
      'JavaScript',
      'Tailwind CSS',
      'Spring Boot',
      'Flutter',
      'AWS',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteJsonLd({ siteConfig }: Pick<JsonLdProps, 'siteConfig'>) {
  const siteUrl = getSiteUrl(siteConfig);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: [
      `${PROFILE_HANDLE} portfolio`,
      `@${PROFILE_HANDLE}`,
      '윤승규 포트폴리오',
    ],
    url: siteUrl,
    description: withProfileHandleDescription(siteConfig.description),
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'ReadAction',
      target: absoluteUrl('/blog', siteConfig),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
