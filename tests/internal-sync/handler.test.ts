import assert from 'node:assert/strict';
import test from 'node:test';

import { PortfolioSectionSyncError } from '@/lib/internal-sync/db';
import {
  handlePortfolioSyncGet,
  handlePortfolioSyncPost,
  type PortfolioSyncHandlerDeps,
} from '@/lib/internal-sync/handler';

import {
  makePortfolioBootstrapPayloads,
  makePortfolioSyncRequest,
} from './fixtures';

const makeDeps = (
  overrides: Partial<PortfolioSyncHandlerDeps> = {},
): PortfolioSyncHandlerDeps => ({
  expectedToken: 'sync-secret',
  exportBootstrap: async () => makePortfolioBootstrapPayloads(),
  syncSections: async () => ({
    updatedSections: ['projects', 'project-portfolio-sync', 'activity-heatmap'],
    updatedAtBySection: {
      projects: '2026-04-22T08:40:11.123Z',
      'project-portfolio-sync': '2026-04-22T08:40:11.123Z',
      'activity-heatmap': '2026-04-22T08:40:11.123Z',
    },
  }),
  ...overrides,
});

test('GET returns 401 without a bearer token', async () => {
  const response = await handlePortfolioSyncGet(new Request('http://localhost'), makeDeps());

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'Missing bearer token',
  });
});

test('GET returns bootstrap payloads with a valid bearer token', async () => {
  const response = await handlePortfolioSyncGet(
    new Request('http://localhost', {
      headers: { authorization: 'Bearer sync-secret' },
    }),
    makeDeps(),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    payloads: makePortfolioBootstrapPayloads(),
  });
});

test('POST validates the request body before syncing', async () => {
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        payloads: {
          projects: [],
          'project-portfolio-sync': {
            generatedAt: '2026-04-22T17:40:00+09:00',
            projects: [],
          },
        },
        meta: {
          source: 'daily-project-sync',
          runAt: '2026-04-22T17:40:00+09:00',
        },
      }),
    }),
    makeDeps(),
  );

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, 'Validation failed');
});

test('POST returns 400 for malformed JSON', async () => {
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: '{"payloads":',
    }),
    makeDeps(),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'Invalid JSON body',
  });
});

test('POST syncs all three sections in one transaction', async () => {
  const request = makePortfolioSyncRequest();
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    }),
    makeDeps(),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    updatedSections: ['projects', 'project-portfolio-sync', 'activity-heatmap'],
    updatedAtBySection: {
      projects: '2026-04-22T08:40:11.123Z',
      'project-portfolio-sync': '2026-04-22T08:40:11.123Z',
      'activity-heatmap': '2026-04-22T08:40:11.123Z',
    },
  });
});

test('POST surfaces section-specific db errors', async () => {
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify(makePortfolioSyncRequest()),
    }),
    makeDeps({
      syncSections: async () => {
        throw new PortfolioSectionSyncError(
          'project-portfolio-sync',
          'boom',
        );
      },
    }),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'Failed to sync portfolio sections',
    section: 'project-portfolio-sync',
    details: 'boom',
  });
});
