import { z } from 'zod';

import { sectionPayloadSchemaMap } from '@/lib/types/payload';

export const portfolioBootstrapSectionKeys = [
  'projects',
  'project-portfolio-sync',
] as const;

export const portfolioSyncSectionKeys = [
  'projects',
  'project-portfolio-sync',
  'activity-heatmap',
] as const;

export type PortfolioBootstrapSectionKey =
  (typeof portfolioBootstrapSectionKeys)[number];

export type PortfolioSyncSectionKey =
  (typeof portfolioSyncSectionKeys)[number];

export const portfolioSyncRequestSchema = z
  .object({
    payloads: z.object({
      projects: sectionPayloadSchemaMap.projects,
      'project-portfolio-sync': sectionPayloadSchemaMap['project-portfolio-sync'],
      'activity-heatmap': sectionPayloadSchemaMap['activity-heatmap'],
    }),
    meta: z
      .object({
        source: z.string().min(1),
        runAt: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type PortfolioSyncRequestBody = z.infer<
  typeof portfolioSyncRequestSchema
>;

export type PortfolioSyncPayloads = PortfolioSyncRequestBody['payloads'];

export type PortfolioBootstrapPayloads = Pick<
  PortfolioSyncPayloads,
  'projects' | 'project-portfolio-sync'
>;

export const parsePortfolioSyncRequest = (input: unknown) =>
  portfolioSyncRequestSchema.safeParse(input);
