import type { Project } from '@/lib/types/view';

export function selectFeaturedProjects(projects: Project[], ids: number[]): Project[] {
  const byId = new Map(projects.map((project) => [project.id, project]));
  return ids.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });
}

export function missingFeaturedProjectIds(projects: Project[], ids: number[]): number[] {
  const available = new Set(projects.map((project) => project.id));
  return ids.filter((id) => !available.has(id));
}
