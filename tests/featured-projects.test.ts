import assert from 'node:assert/strict';
import test from 'node:test';
import { featuredProjectsPayloadSchema } from '../lib/types/payload';
import { selectFeaturedProjects } from '../lib/projects/featured';
import type { Project } from '../lib/types/view';

const projects = [
  { id: 10, title: 'A' },
  { id: 20, title: 'B' },
  { id: 30, title: 'C' },
] as Project[];

test('featured projects preserve the saved order and skip removed projects', () => {
  assert.deepEqual(selectFeaturedProjects(projects, [30, 999, 10]).map((p) => p.id), [30, 10]);
});

test('featured selection accepts empty or three unique IDs', () => {
  assert.equal(featuredProjectsPayloadSchema.safeParse({ ids: [] }).success, true);
  assert.equal(featuredProjectsPayloadSchema.safeParse({ ids: [10, 20, 30] }).success, true);
  assert.equal(featuredProjectsPayloadSchema.safeParse({ ids: [10, 20] }).success, false);
  assert.equal(featuredProjectsPayloadSchema.safeParse({ ids: [10, 10, 30] }).success, false);
});
