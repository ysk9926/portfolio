import type {
  Project,
  ProjectPortfolioSync,
  ProjectPortfolioSyncEntry,
} from '@/lib/types';

export const normalizeProjectKey = (value: string): string =>
  value.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

const trimMarkdownExtension = (value: string): string =>
  value.replace(/\.md$/i, '');

const slugify = (value: string): string => {
  const slug = value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'project';
};

const getSyncSlugSource = (entry?: ProjectPortfolioSyncEntry): string | null => {
  if (!entry) return null;

  if (entry.sourceDocRelative) {
    return trimMarkdownExtension(entry.sourceDocRelative.split('/').at(-1) ?? '');
  }

  return entry.linkedRepos[0] || entry.projectKey || entry.projectTitle || entry.headline;
};

const getProjectSlugBase = (project: Project): string => {
  const slugSource =
    getSyncSlugSource(project.portfolioSync) ||
    project.githubUrl?.split('/').filter(Boolean).at(-1) ||
    project.title;

  return slugify(slugSource);
};

export const getProjectSlug = (project: Project): string =>
  `${getProjectSlugBase(project)}-${project.id}`;

export const projectPath = (project: Project): string =>
  `/projects/${getProjectSlug(project)}`;

export const getProjectSummary = (project: Project): string =>
  project.portfolioSync?.summary ||
  project.shortDescription ||
  project.star?.summary ||
  project.description;

export const getProjectUpdatedDate = (project: Project): Date | null => {
  const rawDate = project.portfolioSync?.updated || null;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const mergePortfolioProjects = (
  projectsData: Project[],
  projectPortfolioSyncData: ProjectPortfolioSync,
): Project[] => {
  const syncLookup = projectPortfolioSyncData.projects.reduce<
    Record<string, ProjectPortfolioSyncEntry>
  >((acc, entry) => {
    const lookupKeys = [
      entry.projectKey,
      normalizeProjectKey(entry.projectTitle),
      normalizeProjectKey(entry.headline),
    ].filter(Boolean);

    for (const lookupKey of lookupKeys) {
      acc[lookupKey] = entry;
    }

    return acc;
  }, {});

  return projectsData.map((project) => {
    const portfolioSync = syncLookup[normalizeProjectKey(project.title)];

    return {
      ...project,
      period: portfolioSync?.period || project.period,
      shortDescription: portfolioSync?.summary || project.shortDescription,
      thumbnail: portfolioSync?.thumbnail || project.thumbnail,
      screenshots: portfolioSync?.screenshots.length
        ? portfolioSync.screenshots
        : project.screenshots,
      portfolioSync,
    };
  });
};

export const findProjectBySlug = (
  projects: Project[],
  slug: string,
): Project | undefined => {
  const normalizedSlug = slugify(slug);
  return projects.find(
    (project) =>
      getProjectSlug(project) === normalizedSlug ||
      getProjectSlugBase(project) === normalizedSlug ||
      String(project.id) === normalizedSlug,
  );
};
