import type { MetadataRoute } from 'next';
import { listPublishedPosts } from '@/lib/blog/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || 'https://portfolio.example.com';

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
    const posts = await listPublishedPosts();
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
  } catch {
    // ignore — sitemap should still render
  }

  return entries;
}
