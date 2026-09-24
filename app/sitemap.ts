import type { MetadataRoute } from 'next';
import { listAllTags, listPublishedPosts } from '@/lib/blog/server';
import { tagPath } from '@/lib/blog/tags';
import {
  getPortfolioPageData,
  getSectionUpdatedAt,
  getSiteData,
} from '@/lib/portfolio-data/server';
import {
  getProjectUpdatedDate,
  mergePortfolioProjects,
  projectPath,
} from '@/lib/projects/portfolio';
import type { SiteConfig } from '@/lib/types/view';
import { getSiteUrl } from '@/lib/seo/url';
import { isIndexableTagPage, latestKnownDate } from '@/lib/seo/sitemap-policy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let siteConfig: SiteConfig | undefined;
  let homeLastModified: Date | undefined;
  const projectEntries: MetadataRoute.Sitemap = [];

  try {
    const [portfolioData, siteUpdatedAt, projectsUpdatedAt, syncUpdatedAt] =
      await Promise.all([
        getPortfolioPageData(),
        getSectionUpdatedAt('site'),
        getSectionUpdatedAt('projects'),
        getSectionUpdatedAt('project-portfolio-sync'),
      ]);

    siteConfig = portfolioData.site.config;
    homeLastModified =
      latestKnownDate([
        siteUpdatedAt,
        projectsUpdatedAt,
        syncUpdatedAt,
        portfolioData.activityHeatmap.generatedAt,
      ]);

    const projectFallbackDate =
      latestKnownDate([projectsUpdatedAt, syncUpdatedAt]) ?? homeLastModified;
    const projects = mergePortfolioProjects(
      portfolioData.projects,
      portfolioData.projectPortfolioSync,
    );

    for (const project of projects) {
      projectEntries.push({
        url: `${getSiteUrl(siteConfig)}${projectPath(project)}`,
        lastModified: getProjectUpdatedDate(project) ?? projectFallbackDate,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch {
    // SITE_URL is enough for canonical sitemap URLs if portfolio data is unavailable.
    try {
      siteConfig = (await getSiteData()).config;
    } catch {
      // ignore
    }
  }

  const siteUrl = getSiteUrl(siteConfig);

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: homeLastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...projectEntries,
  ];

  try {
    const [posts, tags] = await Promise.all([listPublishedPosts(), listAllTags()]);
    const latestPostDate = latestKnownDate(
      posts.flatMap((post) => [post.updatedAt, post.publishedAt]),
    );

    entries.push({
      url: `${siteUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    for (const post of posts) {
      entries.push({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: latestKnownDate([post.updatedAt, post.publishedAt]),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }

    for (const tag of tags) {
      const tagPosts = posts.filter((post) => post.tags.includes(tag));
      if (!isIndexableTagPage(tagPosts.length)) continue;

      const latestUpdatedAt = tagPosts
        .map((post) => post.updatedAt)
        .sort()
        .at(-1);

      entries.push({
        url: `${siteUrl}${tagPath(tag)}`,
        lastModified: latestKnownDate([latestUpdatedAt]) ?? latestPostDate,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // ignore — sitemap should still render
  }

  return entries;
}
