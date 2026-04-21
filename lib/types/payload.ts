import { z } from 'zod';

export const sectionKeys = [
  'site',
  'about',
  'skills',
  'archiving',
  'career',
  'projects',
  'project-portfolio-sync',
  'activity-heatmap',
] as const;

export type SectionKey = (typeof sectionKeys)[number];
export const isSectionKey = (value: string): value is SectionKey =>
  (sectionKeys as readonly string[]).includes(value);

const requiredString = z.string();
const nullableString = z.string().nullable();
const optionalString = z.string().optional();

export const navItemSchema = z.object({
  label: requiredString,
  href: requiredString,
});

export const sitePayloadSchema = z.object({
  config: z.object({
    name: requiredString,
    title: requiredString,
    description: requiredString,
    url: requiredString,
    ogImage: requiredString,
  }),
  nav: z.array(navItemSchema),
  hero: z.object({
    greeting: requiredString,
    name: requiredString,
    role: requiredString,
    tagline: requiredString,
    cta: requiredString,
  }),
  aboutSummary: requiredString,
  profileImage: requiredString,
  footer: z.object({
    copyright: requiredString,
    builtWith: requiredString,
  }),
});

export const aboutPayloadSchema = z.array(
  z.object({
    icon: requiredString,
    label: requiredString,
    value: requiredString,
  }),
);

export const skillsPayloadSchema = z.array(
  z.object({
    category: requiredString,
    color: requiredString,
    skills: z.array(
      z.object({
        name: requiredString,
        level: z.number().int(),
        detail: optionalString,
      }),
    ),
  }),
);

export const archivingPayloadSchema = z.array(
  z.object({
    title: requiredString,
    description: requiredString,
    url: requiredString,
    details: z.array(requiredString),
  }),
);

export const careerPayloadSchema = z.array(
  z.object({
    company: requiredString,
    role: requiredString,
    period: requiredString,
    description: requiredString,
    achievements: z.array(requiredString),
  }),
);

export const projectStarSchema = z.object({
  summary: requiredString,
  role: requiredString,
  background: requiredString,
  solutions: requiredString,
  results: requiredString,
  troubleshooting: optionalString,
});

export const projectsPayloadSchema = z.array(
  z.object({
    id: z.number().int(),
    title: requiredString,
    period: requiredString,
    description: requiredString,
    features: z.array(requiredString),
    techStack: z.array(requiredString),
    deployUrl: optionalString,
    githubUrl: optionalString,
    isMain: z.boolean(),
    thumbnail: requiredString,
    screenshots: z.array(requiredString),
    shortDescription: optionalString,
    star: projectStarSchema.optional(),
  }),
);

export const projectPortfolioSyncEntrySchema = z.object({
  projectKey: requiredString,
  projectTitle: requiredString,
  sourceDoc: requiredString,
  sourceDocRelative: requiredString,
  headline: requiredString,
  summary: requiredString,
  status: requiredString,
  period: requiredString,
  company: requiredString,
  role: requiredString,
  teamSize: requiredString,
  updated: requiredString,
  tech: z.array(requiredString),
  track: requiredString,
  todayCommitCount: z.number().int(),
  lastAuthoredCommitAt: requiredString,
  linkedRepos: z.array(requiredString),
  recentUpdates: requiredString,
  portfolioNotes: requiredString,
  thumbnail: requiredString,
  screenshots: z.array(requiredString),
  screenshotCount: z.number().int(),
});

export const projectPortfolioSyncPayloadSchema = z.object({
  generatedAt: requiredString,
  projects: z.array(projectPortfolioSyncEntrySchema),
});

export const activityProjectRefSchema = z.object({
  name: requiredString,
  count: z.number().int(),
  track: z.union([z.literal('회사'), z.literal('개인')]),
});

export const activityDaySchema = z.object({
  date: requiredString,
  weekday: requiredString,
  inRange: z.boolean(),
  companyCommitCount: z.number().int(),
  personalCommitCount: z.number().int(),
  companyProjects: z.array(activityProjectRefSchema),
  personalProjects: z.array(activityProjectRefSchema),
  totalCommitCount: z.number().int(),
  intensityLevel: z.number().int(),
  companyIntensityLevel: z.number().int(),
  personalIntensityLevel: z.number().int(),
  hasActivity: z.boolean(),
});

export const activityHeatmapPayloadSchema = z.object({
  generatedAt: requiredString,
  rangeStart: requiredString,
  rangeEnd: requiredString,
  summary: z.object({
    activeDays: z.number().int(),
    companyActiveDays: z.number().int(),
    personalActiveDays: z.number().int(),
    totalCompanyCommits: z.number().int(),
    totalPersonalCommits: z.number().int(),
    totalCommits: z.number().int(),
    latestActiveDate: nullableString,
  }),
  weeks: z.array(
    z.object({
      weekStart: requiredString,
      days: z.array(activityDaySchema),
    }),
  ),
});

export const sectionPayloadSchemaMap = {
  site: sitePayloadSchema,
  about: aboutPayloadSchema,
  skills: skillsPayloadSchema,
  archiving: archivingPayloadSchema,
  career: careerPayloadSchema,
  projects: projectsPayloadSchema,
  'project-portfolio-sync': projectPortfolioSyncPayloadSchema,
  'activity-heatmap': activityHeatmapPayloadSchema,
} as const;

export type SitePayload = z.infer<typeof sitePayloadSchema>;
export type AboutPayload = z.infer<typeof aboutPayloadSchema>;
export type SkillsPayload = z.infer<typeof skillsPayloadSchema>;
export type ArchivingPayload = z.infer<typeof archivingPayloadSchema>;
export type CareerPayload = z.infer<typeof careerPayloadSchema>;
export type ProjectsPayload = z.infer<typeof projectsPayloadSchema>;
export type ProjectPortfolioSyncPayload = z.infer<
  typeof projectPortfolioSyncPayloadSchema
>;
export type ActivityHeatmapPayload = z.infer<typeof activityHeatmapPayloadSchema>;

export interface SectionPayloadMap {
  site: SitePayload;
  about: AboutPayload;
  skills: SkillsPayload;
  archiving: ArchivingPayload;
  career: CareerPayload;
  projects: ProjectsPayload;
  'project-portfolio-sync': ProjectPortfolioSyncPayload;
  'activity-heatmap': ActivityHeatmapPayload;
}
