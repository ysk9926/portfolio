import assert from 'node:assert/strict';
import test from 'node:test';
import { currentSectionPayload } from '../lib/admin/section-payload';

test('a section switch does not pass the previous section payload to the new editor', () => {
  const sitePayload = { title: 'Portfolio' };

  assert.equal(currentSectionPayload('featured-projects', 'site', sitePayload), null);
  assert.deepEqual(currentSectionPayload('featured-projects', 'featured-projects', { ids: [] }), { ids: [] });
});
