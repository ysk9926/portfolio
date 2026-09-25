import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import type { Metadata } from 'next';
import {
  PersonJsonLd,
  ProfilePageJsonLd,
  WebSiteJsonLd,
} from '@/components/seo/JsonLd';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { getSiteData } from '@/lib/portfolio-data/server';
import { absoluteImageUrl, getSiteUrl } from '@/lib/seo/url';
import {
  PROFILE_HANDLE,
  withProfileHandle,
} from '@/lib/seo/profile';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  const siteConfig = site.config;
  const siteUrl = getSiteUrl(siteConfig);
  const ogImage = absoluteImageUrl(null, siteConfig);
  const metadataBase = new URL(siteUrl);
  const title = withProfileHandle(siteConfig.title);
  const description = `${site.hero.name}(${PROFILE_HANDLE})의 포트폴리오입니다. ${site.hero.role}. 기업용 업무 시스템·금융/세무 연동·RAG AI 프로젝트의 설계와 운영 경험을 소개합니다.`;
  const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase,
    title,
    description,
    keywords: [
      PROFILE_HANDLE,
      `@${PROFILE_HANDLE}`,
      '윤승규',
      '프론트엔드',
      '풀스택 개발자',
      '개발자 포트폴리오',
      'AI 활용 개발자',
      'Claude Code',
      'Codex CLI',
      'React',
      'Next.js',
      'TypeScript',
    ],
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    verification: googleSiteVerification
      ? { google: googleSiteVerification }
      : undefined,
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteData();

  return (
    <AnalyticsProvider>
      <PersonJsonLd siteConfig={site.config} heroData={site.hero} />
      <ProfilePageJsonLd siteConfig={site.config} heroData={site.hero} />
      <WebSiteJsonLd siteConfig={site.config} />
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-white px-4 py-3 font-semibold text-neutral-950 shadow-lg transition-transform focus:translate-y-0"
      >
        본문으로 건너뛰기
      </a>
      <Header navItems={site.nav} heroName={site.hero.name} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer footerData={site.footer} />
      <ScrollToTop />
    </AnalyticsProvider>
  );
}
