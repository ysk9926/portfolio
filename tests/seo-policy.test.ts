import assert from 'node:assert/strict';
import test from 'node:test';
import { isIndexableTagPage, latestKnownDate } from '../lib/seo/sitemap-policy';

test('tag archives need at least two published posts to be indexed', () => {
  assert.equal(isIndexableTagPage(0), false);
  assert.equal(isIndexableTagPage(1), false);
  assert.equal(isIndexableTagPage(2), true);
});

test('sitemap dates use the latest real update and omit unknown dates', () => {
  assert.equal(latestKnownDate([null, undefined, 'invalid']), undefined);
  assert.equal(
    latestKnownDate(['2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z'])?.toISOString(),
    '2026-09-01T00:00:00.000Z',
  );
});
