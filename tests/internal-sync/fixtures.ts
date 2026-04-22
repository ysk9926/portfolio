export const makePortfolioSyncRequest = () => ({
  payloads: {
    projects: [
      {
        id: 1,
        title: 'Sample Project',
        period: '2026.04 ~ 2026.05',
        description: 'Sample description',
        features: ['Feature A'],
        techStack: ['Next.js'],
        deployUrl: 'https://example.com',
        githubUrl: 'https://github.com/example/sample',
        isMain: true,
        thumbnail: '/images/projects/generated/sample/01-item.png',
        screenshots: ['/images/projects/generated/sample/01-item.png'],
        shortDescription: 'Sample short description',
      },
    ],
    'project-portfolio-sync': {
      generatedAt: '2026-04-22T17:40:00+09:00',
      projects: [
        {
          projectKey: 'sample-project',
          projectTitle: 'Sample Project',
          sourceDoc: '/abs/path/sample.md',
          sourceDocRelative: 'sample.md',
          headline: 'Sample Project',
          summary: 'Sample summary',
          status: '진행중',
          period: '2026.04 ~ 2026.05',
          company: '개인 프로젝트',
          role: '풀스택 개발',
          teamSize: '1',
          updated: '2026-04-22',
          tech: ['Next.js'],
          track: '개인',
          todayCommitCount: 0,
          lastAuthoredCommitAt: '2026-04-22 17:40',
          linkedRepos: ['sample-project'],
          recentUpdates: '- sample',
          portfolioNotes: '- sample',
          thumbnail: '/images/projects/generated/sample/01-item.png',
          screenshots: ['/images/projects/generated/sample/01-item.png'],
          screenshotCount: 1,
        },
      ],
    },
    'activity-heatmap': {
      generatedAt: '2026-04-22T17:40:00+09:00',
      rangeStart: '2025-04-23',
      rangeEnd: '2026-04-22',
      summary: {
        activeDays: 0,
        companyActiveDays: 0,
        personalActiveDays: 0,
        totalCompanyCommits: 0,
        totalPersonalCommits: 0,
        totalCommits: 0,
        latestActiveDate: null,
      },
      weeks: [],
    },
  },
  meta: {
    source: 'daily-project-sync',
    runAt: '2026-04-22T17:40:00+09:00',
  },
});

export const makePortfolioSyncPayloads = () => makePortfolioSyncRequest().payloads;

export const makePortfolioBootstrapPayloads = () => ({
  projects: makePortfolioSyncRequest().payloads.projects,
  'project-portfolio-sync': makePortfolioSyncRequest().payloads['project-portfolio-sync'],
});
