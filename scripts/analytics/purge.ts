import { pathToFileURL } from 'node:url';
import { loadEnvConfig } from '@next/env';
import type { Pool } from 'pg';

import { getAnalyticsPool } from '../../lib/analytics/db';

export const purgeAnalytics = async (
  pool: Pool,
  now: Date,
  dryRun: boolean,
): Promise<{ sessions: number; rateLimits: number; tombstones: number }> => {
  const result = await pool.query<{
    sessions: string | number;
    rate_limits: string | number;
    tombstones: string | number;
  }>(
    'select * from public.analytics_purge($1::timestamptz, $2::boolean)',
    [now, dryRun],
  );
  const row = result.rows[0];
  return {
    sessions: Number(row?.sessions ?? 0),
    rateLimits: Number(row?.rate_limits ?? 0),
    tombstones: Number(row?.tombstones ?? 0),
  };
};

const main = async () => {
  loadEnvConfig(process.cwd());
  const dryRun = process.argv.includes('--dry-run');
  const pool = getAnalyticsPool();
  try {
    const result = await purgeAnalytics(pool, new Date(), dryRun);
    process.stdout.write(`${JSON.stringify({ dryRun, ...result })}\n`);
  } finally {
    await pool.end();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown analytics purge error';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
