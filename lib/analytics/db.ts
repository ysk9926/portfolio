import { Pool } from 'pg';

let analyticsPool: Pool | null = null;

export const getAnalyticsPool = (): Pool => {
  if (!analyticsPool) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error('Missing env: SUPABASE_DB_URL');
    }

    analyticsPool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return analyticsPool;
};
