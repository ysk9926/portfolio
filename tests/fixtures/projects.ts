import type { Project, ProjectPortfolioSync } from '../../lib/types';

/**
 * Minimal fixtures for image-URL normalization.
 *
 * Deliberately not real portfolio data: the source of truth is the DB, and
 * snapshots of it drift. These only need to cover the shapes the merge walks —
 * a sync-matched project, an unmatched one, and a project with no images.
 */
export const projectsFixture: Project[] = [
  {
    id: 1,
    title: 'Matched Project',
    period: '2026.01 ~ 2026.02',
    description: 'matched',
    shortDescription: 'matched',
    features: [],
    techStack: [],
    githubUrl: '',
    thumbnail: '/images/projects/generated/matched/thumb.png',
    screenshots: ['/images/projects/generated/matched/01.png'],
  } as unknown as Project,
  {
    id: 2,
    title: 'Unmatched Project',
    period: '',
    description: 'falls back to its own images',
    shortDescription: '',
    features: [],
    techStack: [],
    githubUrl: '',
    thumbnail: '/images/projects/generated/unmatched/thumb.png',
    screenshots: [],
  } as unknown as Project,
  {
    id: 3,
    title: 'No Images',
    period: '',
    description: 'no images at all',
    shortDescription: '',
    features: [],
    techStack: [],
    githubUrl: '',
    thumbnail: '',
    screenshots: [],
  } as unknown as Project,
];

/** `projectTitle` must match a project title — the merge joins on normalized title. */
export const syncFixture: ProjectPortfolioSync = {
  generatedAt: '2026-01-01T00:00:00+09:00',
  projects: [
    {
      projectKey: 'matched',
      projectTitle: 'Matched Project',
      headline: 'Matched Project',
      summary: 'from sync',
      period: '2026.01 ~ 2026.03',
      thumbnail: '/images/projects/generated/matched/sync-thumb.png',
      screenshots: [
        '/images/projects/generated/matched/sync-01.png',
        '/images/projects/generated/matched/sync-02.jpg',
      ],
      linkedRepos: [],
      sourceDoc: '',
      sourceDocRelative: '',
      status: '',
      company: '',
      role: '',
      teamSize: '',
      updated: '',
      tech: [],
      track: '',
      todayCommitCount: 0,
      lastAuthoredCommitAt: '',
      recentUpdates: '',
      portfolioNotes: '',
      screenshotCount: 2,
    } as unknown as ProjectPortfolioSync['projects'][number],
  ],
};

export const emptySync: ProjectPortfolioSync = { generatedAt: '', projects: [] };
