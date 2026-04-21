'use client';

import { Info } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';

interface ReadOnlyViewerProps {
  title: string;
  description: string;
  payload: unknown;
  syncHint?: string;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export function ReadOnlyViewer({ title, description, payload, syncHint }: ReadOnlyViewerProps) {
  const summary = buildSummary(payload);

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>
            이 섹션은 자동 수집된 데이터입니다. 편집은 지원하지 않으며, 원본 소스 업데이트 후 동기화 스크립트로 갱신됩니다.
            {syncHint && <span className="ml-1 text-amber-700">{syncHint}</span>}
          </span>
        </div>

        {summary.length > 0 && (
          <div className="grid gap-2 md:grid-cols-3">
            {summary.map((item) => (
              <Stat key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        )}

        <details className="rounded-lg border border-neutral-200 bg-neutral-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
            전체 JSON 보기
          </summary>
          <pre className="max-h-[480px] overflow-auto border-t border-neutral-200 bg-neutral-950 p-4 font-mono text-[11px] leading-relaxed text-neutral-100">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </CardBody>
    </Card>
  );
}

function buildSummary(payload: unknown): Array<{ label: string; value: string | number }> {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as Record<string, unknown>;
  const items: Array<{ label: string; value: string | number }> = [];

  if (typeof data.generatedAt === 'string') {
    const parsed = new Date(data.generatedAt);
    items.push({
      label: 'generatedAt',
      value: Number.isNaN(parsed.getTime())
        ? data.generatedAt
        : parsed.toLocaleString('ko-KR', { hour12: false }),
    });
  }

  if (Array.isArray(data.projects)) {
    items.push({ label: 'projects', value: data.projects.length });
  }

  if (typeof data.rangeStart === 'string' && typeof data.rangeEnd === 'string') {
    items.push({ label: 'range', value: `${data.rangeStart} ~ ${data.rangeEnd}` });
  }

  if (data.summary && typeof data.summary === 'object') {
    const summary = data.summary as Record<string, unknown>;
    if (typeof summary.totalCommits === 'number') {
      items.push({ label: 'total commits', value: summary.totalCommits });
    }
    if (typeof summary.activeDays === 'number') {
      items.push({ label: 'active days', value: summary.activeDays });
    }
    if (typeof summary.latestActiveDate === 'string' && summary.latestActiveDate) {
      items.push({ label: 'latest active', value: summary.latestActiveDate });
    }
  }

  return items;
}
