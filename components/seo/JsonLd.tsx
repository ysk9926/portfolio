import { HeroData, SiteConfig } from '@/lib/types/view';
import { absoluteUrl, getSiteUrl } from '@/lib/seo/url';

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
    jobTitle: heroData.role,
    url: siteUrl,
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
    url: siteUrl,
    description: siteConfig.description,
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
