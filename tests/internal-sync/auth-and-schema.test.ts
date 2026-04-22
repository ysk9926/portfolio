import assert from 'node:assert/strict';
import test from 'node:test';

import { assertPortfolioSyncToken } from '@/lib/internal-sync/auth';
import {
  parsePortfolioSyncRequest,
  portfolioBootstrapSectionKeys,
  portfolioSyncSectionKeys,
} from '@/lib/internal-sync/schema';

import { makePortfolioSyncRequest } from './fixtures';

test('portfolio sync section keys stay in write order', () => {
  assert.deepEqual(portfolioSyncSectionKeys, [
    'projects',
    'project-portfolio-sync',
    'activity-heatmap',
  ]);
  assert.deepEqual(portfolioBootstrapSectionKeys, [
    'projects',
    'project-portfolio-sync',
  ]);
});

test('assertPortfolioSyncToken returns 401 when auth header is missing', () => {
  const result = assertPortfolioSyncToken(new Headers(), 'sync-secret');

  assert.deepEqual(result, {
    ok: false,
    status: 401,
    error: 'Missing bearer token',
  });
});

test('assertPortfolioSyncToken returns 403 when token is wrong', () => {
  const headers = new Headers({
    authorization: 'Bearer wrong-secret',
  });
  const result = assertPortfolioSyncToken(headers, 'sync-secret');

  assert.deepEqual(result, {
    ok: false,
    status: 403,
    error: 'Invalid bearer token',
  });
});

test('parsePortfolioSyncRequest accepts the full three-section payload', () => {
  const parsed = parsePortfolioSyncRequest(makePortfolioSyncRequest());

  assert.equal(parsed.success, true);
});

test('parsePortfolioSyncRequest rejects a request missing activity-heatmap', () => {
  const invalid = makePortfolioSyncRequest();
  // @ts-expect-error intentional invalid fixture
  delete invalid.payloads['activity-heatmap'];

  const parsed = parsePortfolioSyncRequest(invalid);

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.match(
    JSON.stringify(parsed.error.flatten()),
    /expected object, received undefined/,
  );
});
