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

const toValidDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const latestDate = (
  values: Array<Date | string | null | undefined>,
): Date | null => {
  return values.reduce<Date | null>((latest, value) => {
    const date = toValidDate(value);
    if (!date) return latest;
    if (!latest || date > latest) return date;
    return latest;
  }, null);
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let siteConfig: SiteConfig | undefined;
  const fallbackDate = new Date();
  let homeLastModified: Date = fallbackDate;
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
      latestDate([
        siteUpdatedAt,
        projectsUpdatedAt,
        syncUpdatedAt,
        portfolioData.activityHeatmap.generatedAt,
      ]) ?? fallbackDate;

    const projectFallbackDate =
      latestDate([projectsUpdatedAt, syncUpdatedAt]) ?? homeLastModified;
    const projects = mergePortfolioProjects(
      portfolioData.projects,
      portfolioData.projectPortfolioSync,
    );

    for (const project of projects) {
      projectEntries.push({
        url: `${getSiteUrl(siteConfig)}${projectPath(project)}`,
        lastModified: getProjectUpdatedDate(project) ?? projectFallbackDate,
        changeFrequency: 'monthly',
        priority: project.isMain ? 0.75 : 0.6,
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
    const latestPostDate =
      latestDate(posts.flatMap((post) => [post.updatedAt, post.publishedAt])) ??
      fallbackDate;

    entries.push({
      url: `${siteUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

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
        lastModified: toValidDate(latestUpdatedAt) ?? latestPostDate,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // ignore — sitemap should still render
  }

  return entries;
}
