import { HeroData, SiteConfig } from '@/lib/types/view';

interface JsonLdProps {
  siteConfig: SiteConfig;
  heroData: HeroData;
}

export function PersonJsonLd({ siteConfig, heroData }: JsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: heroData.name,
    jobTitle: heroData.role,
    url: siteConfig.url,
    knowsAbout: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteJsonLd({ siteConfig }: Pick<JsonLdProps, 'siteConfig'>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: 'ko-KR',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
