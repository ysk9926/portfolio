'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { FeaturedProjectsPayload, ProjectsPayload } from '@/lib/types/payload';
import { Card, CardBody, CardHeader } from '../ui/Card';

interface FeaturedProjectsEditorProps {
  value: FeaturedProjectsPayload;
  onChange: (next: FeaturedProjectsPayload) => void;
}

export function FeaturedProjectsEditor({ value, onChange }: FeaturedProjectsEditorProps) {
  const [projects, setProjects] = useState<ProjectsPayload>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/sections/projects', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('프로젝트 목록을 불러오지 못했습니다.');
        return response.json() as Promise<{ payload: ProjectsPayload }>;
      })
      .then((body) => { if (active) setProjects(body.payload); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : '프로젝트 목록 오류');
      });
    return () => { active = false; };
  }, []);

  const available = new Set(projects.map((project) => project.id));
  const missing = value.ids.filter((id) => !available.has(id));

  const selectAt = (index: number, selected: number) => {
    const next = [...value.ids];
    if (selected === 0) next.splice(index, 1);
    else next[index] = selected;
    onChange({ ids: next });
  };

  const move = (index: number, offset: number) => {
    const next = [...value.ids];
    const target = index + offset;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ids: next });
  };

  return (
    <Card>
      <CardHeader title="대표 프로젝트" description="전체 프로젝트에서 3개를 선택하고 홈에 표시할 순서를 정합니다." />
      <CardBody>
        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
        {projects.length === 0 && !error && <p className="mb-4 text-sm text-neutral-500">프로젝트 목록을 불러오는 중입니다.</p>}
        {missing.length > 0 && projects.length > 0 && (
          <p role="alert" className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            삭제된 프로젝트 ID {missing.join(', ')}이(가) 포함되어 있습니다. 다른 프로젝트로 다시 선택해 주세요.
          </p>
        )}
        <div className="space-y-3">
          {[0, 1, 2].map((index) => {
            const id = value.ids[index] ?? 0;
            return (
              <div key={index} className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <label className="min-w-0 flex-1 text-sm font-medium text-neutral-700">
                  <span className="mb-1.5 block">{index + 1}순위</span>
                  <select
                    value={id}
                    disabled={projects.length === 0 || (index > 0 && !value.ids[index - 1])}
                    onChange={(event) => selectAt(index, Number(event.target.value))}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50"
                  >
                    <option value={0}>프로젝트 선택</option>
                    {id !== 0 && !available.has(id) && <option value={id}>삭제된 프로젝트 #{id}</option>}
                    {projects.filter((project) => project.id === id || !value.ids.includes(project.id)).map((project) => (
                      <option key={project.id} value={project.id}>{project.title} · #{project.id}</option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-1 self-end">
                  <button type="button" aria-label={`${index + 1}순위 위로 이동`} disabled={index === 0 || !id} onClick={() => move(index, -1)} className="rounded-md border border-neutral-300 p-2 disabled:opacity-40"><ArrowUp size={16} /></button>
                  <button type="button" aria-label={`${index + 1}순위 아래로 이동`} disabled={index === 2 || !value.ids[index + 1]} onClick={() => move(index, 1)} className="rounded-md border border-neutral-300 p-2 disabled:opacity-40"><ArrowDown size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => onChange({ ids: [] })} className="mt-4 text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-900">대표 설정 해제</button>
        <p className="mt-3 text-xs text-neutral-500">3개를 모두 선택하면 저장할 수 있습니다. 선택하지 않으면 홈에 전체 프로젝트만 표시합니다.</p>
      </CardBody>
    </Card>
  );
}
