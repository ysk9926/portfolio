import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exportPortfolioBootstrapWithClient,
  PortfolioSectionSyncError,
  syncPortfolioSectionsWithClient,
  type PortfolioDbClient,
} from '@/lib/internal-sync/db';

import {
  makePortfolioBootstrapPayloads,
  makePortfolioSyncPayloads,
} from './fixtures';

const createBootstrapClient = (): {
  client: PortfolioDbClient;
  calls: Array<{ text: string; params: readonly unknown[] }>;
} => {
  const calls: Array<{ text: string; params: readonly unknown[] }> = [];
  const payloads = makePortfolioBootstrapPayloads();

  return {
    calls,
    client: {
      async query(text, params = []) {
        calls.push({ text, params });

        const sectionKey = params[0];
        if (text.includes('export_section_payload') && sectionKey === 'projects') {
          return { rows: [{ payload: payloads.projects }] };
        }

        if (
          text.includes('export_section_payload') &&
          sectionKey === 'project-portfolio-sync'
        ) {
          return { rows: [{ payload: payloads['project-portfolio-sync'] }] };
        }

        throw new Error(`Unexpected query: ${text}`);
      },
    },
  };
};

test('exportPortfolioBootstrapWithClient reads projects then sync payloads', async () => {
  const { calls, client } = createBootstrapClient();
  const result = await exportPortfolioBootstrapWithClient(client);

  assert.deepEqual(result, makePortfolioBootstrapPayloads());
  assert.deepEqual(
    calls.map((call) => call.params[0]),
    ['projects', 'project-portfolio-sync'],
  );
});

test('syncPortfolioSectionsWithClient writes in one transaction', async () => {
  const calls: Array<{ text: string; params: readonly unknown[] }> = [];
  const payloads = makePortfolioSyncPayloads();
  const client: PortfolioDbClient = {
    async query(text, params = []) {
      calls.push({ text, params });

      if (text === 'begin' || text === 'commit' || text === 'rollback') {
        return { rows: [] };
      }

      if (text.includes('admin_replace_section')) {
        return { rows: [{ updated_at: '2026-04-22T08:40:11.123Z' }] };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };

  const result = await syncPortfolioSectionsWithClient(client, payloads);

  assert.deepEqual(result.updatedSections, [
    'projects',
    'project-portfolio-sync',
    'activity-heatmap',
  ]);
  assert.deepEqual(calls.map((call) => call.text), [
    'begin',
    'select public.admin_replace_section($1, $2::jsonb) as updated_at',
    'select public.admin_replace_section($1, $2::jsonb) as updated_at',
    'select public.admin_replace_section($1, $2::jsonb) as updated_at',
    'commit',
  ]);
  assert.deepEqual(calls[1].params, ['projects', JSON.stringify(payloads.projects)]);
  assert.deepEqual(
    calls[2].params,
    [
      'project-portfolio-sync',
      JSON.stringify(payloads['project-portfolio-sync']),
    ],
  );
  assert.deepEqual(
    calls[3].params,
    ['activity-heatmap', JSON.stringify(payloads['activity-heatmap'])],
  );
});

test('syncPortfolioSectionsWithClient rolls back on failure', async () => {
  const calls: Array<{ text: string; params: readonly unknown[] }> = [];
  const payloads = makePortfolioSyncPayloads();
  const client: PortfolioDbClient = {
    async query(text, params = []) {
      calls.push({ text, params });

      if (text === 'begin' || text === 'rollback') {
        return { rows: [] };
      }

      if (text.includes('admin_replace_section')) {
        if (params[0] === 'project-portfolio-sync') {
          throw new Error('boom');
        }

        return { rows: [{ updated_at: '2026-04-22T08:40:11.123Z' }] };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };

  await assert.rejects(
    () => syncPortfolioSectionsWithClient(client, payloads),
    (error: unknown) =>
      error instanceof PortfolioSectionSyncError &&
      error.section === 'project-portfolio-sync' &&
      error.message === 'boom',
  );

  assert.deepEqual(calls.map((call) => call.text), [
    'begin',
    'select public.admin_replace_section($1, $2::jsonb) as updated_at',
    'select public.admin_replace_section($1, $2::jsonb) as updated_at',
    'rollback',
  ]);
});
