'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionKey, sectionKeys } from '@/lib/types/payload';

interface AdminSectionEditorProps {
  initialSection?: SectionKey;
}

interface SectionResponse {
  sectionKey: SectionKey;
  payload: unknown;
  updatedAt: string | null;
}

const sectionLabelMap: Record<SectionKey, string> = {
  site: 'site',
  about: 'about',
  skills: 'skills',
  archiving: 'archiving',
  career: 'career',
  projects: 'projects',
  'project-portfolio-sync': 'project-portfolio-sync',
  'activity-heatmap': 'activity-heatmap',
};

export default function AdminSectionEditor({ initialSection = 'site' }: AdminSectionEditorProps) {
  const [sectionKey, setSectionKey] = useState<SectionKey>(initialSection);
  const [jsonText, setJsonText] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const prettyUpdatedAt = useMemo(() => {
    if (!updatedAt) return 'unknown';
    return new Date(updatedAt).toLocaleString('ko-KR', { hour12: false });
  }, [updatedAt]);

  const loadSection = async (nextSectionKey: SectionKey) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/sections/${nextSectionKey}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const body = (await response.json()) as SectionResponse | { error: string };
      if (!response.ok) {
        throw new Error('error' in body ? body.error : '섹션을 불러오지 못했습니다.');
      }

      const parsed = body as SectionResponse;
      setJsonText(JSON.stringify(parsed.payload, null, 2));
      setUpdatedAt(parsed.updatedAt);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '섹션 로딩 실패');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSection(sectionKey);
  }, [sectionKey]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setError('유효한 JSON 형식이 아닙니다.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/sections/${sectionKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload }),
      });

      const body = (await response.json()) as
        | { ok: true; updatedAt: string | null }
        | { error: string };

      if (!response.ok || !('ok' in body && body.ok)) {
        throw new Error('error' in body ? body.error : '저장에 실패했습니다.');
      }

      setUpdatedAt(body.updatedAt);
      setSuccessMessage('저장 완료');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sectionKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSectionKey(key)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              sectionKey === key
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {sectionLabelMap[key]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-500">
            section: <span className="font-medium text-neutral-700">{sectionKey}</span>
          </p>
          <p className="text-xs text-neutral-400">updatedAt: {prettyUpdatedAt}</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">불러오는 중...</p>
        ) : (
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            className="h-[520px] w-full rounded-lg border border-neutral-300 bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-100 outline-none focus:border-neutral-500"
            spellCheck={false}
          />
        )}
      </div>

      {(error || successMessage) && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || successMessage}
        </div>
      )}

      <div>
        <button
          type="button"
          disabled={isSaving || isLoading}
          onClick={handleSave}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
