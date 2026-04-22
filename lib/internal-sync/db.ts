import { Pool, type PoolClient } from 'pg';

import type {
  SectionKey,
  SectionPayloadMap,
} from '@/lib/types/payload';
import { sectionPayloadSchemaMap } from '@/lib/types/payload';

import type {
  PortfolioBootstrapPayloads,
  PortfolioSyncPayloads,
  PortfolioSyncSectionKey,
} from './schema';

export type PortfolioDbClient = {
  query<T = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<{ rows: T[] }>;
};

export type PortfolioSyncResult = {
  updatedSections: PortfolioSyncSectionKey[];
  updatedAtBySection: Record<PortfolioSyncSectionKey, string>;
};

export class PortfolioSectionSyncError extends Error {
  readonly section: PortfolioSyncSectionKey;
  readonly cause: unknown;

  constructor(section: PortfolioSyncSectionKey, message: string, cause?: unknown) {
    super(message);
    this.name = 'PortfolioSectionSyncError';
    this.section = section;
    this.cause = cause;
  }
}

let sharedPool: Pool | null = null;

const getPortfolioDbUrl = () => {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error('Missing env: SUPABASE_DB_URL');
  }
  return dbUrl;
};

const getPortfolioPool = () => {
  if (!sharedPool) {
    sharedPool = new Pool({ connectionString: getPortfolioDbUrl() });
  }

  return sharedPool;
};

const normalizeUpdatedAt = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new Error('Missing updated_at from admin_replace_section');
};

const parseExportedPayload = <K extends SectionKey>(
  sectionKey: K,
  payload: unknown,
): SectionPayloadMap[K] => {
  return sectionPayloadSchemaMap[sectionKey].parse(payload) as SectionPayloadMap[K];
};

const loadSectionPayload = async <K extends SectionKey>(
  client: PortfolioDbClient,
  sectionKey: K,
) => {
  const result = await client.query<{ payload: unknown }>(
    'select public.export_section_payload($1) as payload',
    [sectionKey],
  );

  const payload = result.rows[0]?.payload;
  if (payload === undefined) {
    throw new Error(`Missing payload for section "${sectionKey}"`);
  }

  return parseExportedPayload(sectionKey, payload);
};

export const exportPortfolioBootstrapWithClient = async (
  client: PortfolioDbClient,
): Promise<PortfolioBootstrapPayloads> => ({
  projects: await loadSectionPayload(client, 'projects'),
  'project-portfolio-sync': await loadSectionPayload(
    client,
    'project-portfolio-sync',
  ),
});

export const syncPortfolioSectionsWithClient = async (
  client: PortfolioDbClient,
  payloads: PortfolioSyncPayloads,
): Promise<PortfolioSyncResult> => {
  const updatedAtBySection = {} as Record<PortfolioSyncSectionKey, string>;

  await client.query('begin');

  try {
    const sectionKeys: PortfolioSyncSectionKey[] = [
      'projects',
      'project-portfolio-sync',
      'activity-heatmap',
    ];

    for (const sectionKey of sectionKeys) {
      let result: { rows: Array<{ updated_at: unknown }> };
      try {
        result = await client.query<{ updated_at: unknown }>(
          'select public.admin_replace_section($1, $2::jsonb) as updated_at',
          [sectionKey, JSON.stringify(payloads[sectionKey])],
        );
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Unknown sync error';
        throw new PortfolioSectionSyncError(sectionKey, message, cause);
      }

      const updatedAt = result.rows[0]?.updated_at;
      if (updatedAt === undefined) {
        throw new PortfolioSectionSyncError(
          sectionKey,
          `Missing updated_at for section "${sectionKey}"`,
        );
      }

      updatedAtBySection[sectionKey] = normalizeUpdatedAt(updatedAt);
    }

    await client.query('commit');

    return {
      updatedSections: sectionKeys,
      updatedAtBySection,
    };
  } catch (cause) {
    try {
      await client.query('rollback');
    } catch {
      // Best effort rollback. Preserve the original failure.
    }

    if (cause instanceof PortfolioSectionSyncError) {
      throw cause;
    }

    const message = cause instanceof Error ? cause.message : 'Unknown sync error';
    throw new PortfolioSectionSyncError('projects', message, cause);
  }
};

export const exportPortfolioBootstrap = async (): Promise<PortfolioBootstrapPayloads> => {
  const pool = getPortfolioPool();
  const client: PoolClient = await pool.connect();

  try {
    return await exportPortfolioBootstrapWithClient(client);
  } finally {
    client.release();
  }
};

export const syncPortfolioSections = async (
  payloads: PortfolioSyncPayloads,
): Promise<PortfolioSyncResult> => {
  const pool = getPortfolioPool();
  const client: PoolClient = await pool.connect();

  try {
    return await syncPortfolioSectionsWithClient(client, payloads);
  } finally {
    client.release();
  }
};
