import type { BlogPostSummary } from '@/lib/blog/types';
import type { Project } from '@/lib/types/view';

/** Reviewed links between a real project and articles about its RAG implementation. */
const postSlugsByProjectId: Record<number, string[]> = {
  1278619656: [
    'rag-series-1-pipeline-basics',
    'rag-series-2-chunking-and-embedding',
    'rag-series-3-tool-calling',
    'rag-series-4-operations',
  ],
};

export function relatedPostsForProject(projectId: number, posts: BlogPostSummary[]): BlogPostSummary[] {
  const bySlug = new Map(posts.filter((post) => post.status === 'published').map((post) => [post.slug, post]));
  return (postSlugsByProjectId[projectId] ?? []).flatMap((slug) => {
    const post = bySlug.get(slug);
    return post ? [post] : [];
  });
}

export function relatedProjectsForPost(slug: string, projects: Project[]): Project[] {
  const ids = Object.entries(postSlugsByProjectId)
    .filter(([, slugs]) => slugs.includes(slug))
    .map(([id]) => Number(id));
  const byId = new Map(projects.map((project) => [project.id, project]));
  return ids.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });
}
