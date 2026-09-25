import assert from 'node:assert/strict';
import test from 'node:test';
import { relatedPostsForProject, relatedProjectsForPost } from '../lib/projects/related-content';
import type { BlogPostSummary } from '../lib/blog/types';
import type { Project } from '../lib/types/view';

const published = { slug: 'rag-series-1-pipeline-basics', status: 'published', title: 'RAG 1' } as BlogPostSummary;
const draft = { slug: 'rag-series-2-chunking-and-embedding', status: 'draft', title: 'RAG 2' } as BlogPostSummary;
const project = { id: 1278619656, title: '법률 AI 플랫폼' } as Project;

test('related project articles include only published matching posts', () => {
  assert.deepEqual(relatedPostsForProject(project.id, [draft, published]).map((post) => post.slug), [published.slug]);
});

test('related blog project is absent if its project record was removed', () => {
  assert.deepEqual(relatedProjectsForPost(published.slug, []), []);
  assert.deepEqual(relatedProjectsForPost(published.slug, [project]).map((item) => item.id), [project.id]);
});
