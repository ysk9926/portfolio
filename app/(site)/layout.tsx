import type { Metadata } from 'next';
import { PersonJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { getSiteData } from '@/lib/portfolio-data/server';
import type { NavItem } from '@/lib/types/view';
import { absoluteImageUrl, getSiteUrl } from '@/lib/seo/url';

const withBlogNav = (navItems: NavItem[]): NavItem[] => {
  if (navItems.some((item) => item.href === '/blog')) {
    return navItems;
  }

  const careerIndex = navItems.findIndex((item) => item.href === '#career');
  const blogNavItem: NavItem = { label: 'Blog', href: '/blog' };

  if (careerIndex === -1) {
    return [...navItems, blogNavItem];
  }

  return [
    ...navItems.slice(0, careerIndex),
    blogNavItem,
    ...navItems.slice(careerIndex),
  ];
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  const siteConfig = site.config;
  const siteUrl = getSiteUrl(siteConfig);
  const ogImage = absoluteImageUrl(null, siteConfig);
  const metadataBase = new URL(siteUrl);

  return {
    metadataBase,
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: ['프론트엔드', '개발자', '포트폴리오', 'React', 'Next.js', 'TypeScript'],
    alternates: { canonical: '/' },
    openGraph: {
      title: siteConfig.title,
      description: siteConfig.description,
      url: siteUrl,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.title,
      description: siteConfig.description,
      images: [ogImage],
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
      <Header navItems={withBlogNav(site.nav)} heroName={site.hero.name} />
      <main>{children}</main>
      <Footer footerData={site.footer} />
      <ScrollToTop />
    </>
  );
}
