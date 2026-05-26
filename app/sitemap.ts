import type { MetadataRoute } from 'next';
import { listAllTags, listPublishedPosts } from '@/lib/blog/server';
import { tagPath } from '@/lib/blog/tags';
import { getSiteData } from '@/lib/portfolio-data/server';
import type { SiteConfig } from '@/lib/types/view';
import { getSiteUrl } from '@/lib/seo/url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let siteConfig: SiteConfig | undefined;
  try {
    siteConfig = (await getSiteData()).config;
  } catch {
    // SITE_URL is enough for canonical sitemap URLs if site data is unavailable.
  }

  const siteUrl = getSiteUrl(siteConfig);

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    const [posts, tags] = await Promise.all([listPublishedPosts(), listAllTags()]);
    for (const post of posts) {
      entries.push({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.publishedAt
          ? new Date(post.publishedAt)
          : new Date(post.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }

    for (const tag of tags) {
      const tagPosts = posts.filter((post) => post.tags.includes(tag));
      if (tagPosts.length === 0) continue;

      const latestUpdatedAt = tagPosts
        .map((post) => post.updatedAt)
        .sort()
        .at(-1);

      entries.push({
        url: `${siteUrl}${tagPath(tag)}`,
        lastModified: latestUpdatedAt ? new Date(latestUpdatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // ignore — sitemap should still render
  }

  return entries;
}
