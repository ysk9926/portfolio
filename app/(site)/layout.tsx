import { PersonJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { getSiteData } from '@/lib/portfolio-data/server';

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
