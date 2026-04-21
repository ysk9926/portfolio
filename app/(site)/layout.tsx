import type { Metadata } from 'next';
import { PersonJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { getSiteData } from '@/lib/portfolio-data/server';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  const siteConfig = site.config;
  const metadataBase = new URL(
    process.env.SITE_URL || siteConfig.url || 'https://portfolio.example.com',
  );

  return {
    metadataBase,
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: ['프론트엔드', '개발자', '포트폴리오', 'React', 'Next.js', 'TypeScript'],
    alternates: { canonical: '/' },
    openGraph: {
      title: siteConfig.title,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteData();

  return (
    <>
      <PersonJsonLd siteConfig={site.config} heroData={site.hero} />
      <WebSiteJsonLd siteConfig={site.config} />
      <Header navItems={site.nav} heroName={site.hero.name} />
      <main>{children}</main>
      <Footer footerData={site.footer} />
      <ScrollToTop />
    </>
  );
}
