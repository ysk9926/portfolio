import assert from 'node:assert/strict';
import { Pool } from 'pg';

import { createAnalyticsRepository } from '../../lib/analytics/repository';

const databaseIdentity = (value: string) => {
  const url = new URL(value);
  return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
};

export const openAnalyticsTestDatabase = async () => {
  const connectionString = process.env.ANALYTICS_TEST_DB_URL;
  assert.ok(connectionString, 'ANALYTICS_TEST_DB_URL is required for analytics DB tests');

  const production = process.env.SUPABASE_DB_URL;
  if (production) {
    assert.notEqual(
      databaseIdentity(connectionString),
      databaseIdentity(production),
      'ANALYTICS_TEST_DB_URL must not point to SUPABASE_DB_URL',
    );
  }

  const pool = new Pool({ connectionString, max: 3 });
  const identity = await pool.query<{ database: string; port: number }>(
    'select current_database() as database, inet_server_port() as port',
  );
  assert.equal(identity.rows[0]?.database, 'portfolio_analytics_test');
  assert.equal(identity.rows[0]?.port, 54329);
  // Minimal local fixture for the existing production projects catalog.
  await pool.query('create table if not exists public.projects (id integer primary key, title text not null)');

  return {
    pool,
    repository: createAnalyticsRepository(pool),
    close: () => pool.end(),
  };
};
