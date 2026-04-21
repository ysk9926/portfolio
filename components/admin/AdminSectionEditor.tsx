'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Code2, FormInput, RefreshCw, Save } from 'lucide-react';
import {
  SectionKey,
  isSectionKey,
  sectionPayloadSchemaMap,
} from '@/lib/types/payload';
import { AdminShell, sectionMeta } from './AdminShell';
import { Button } from './ui/Button';
import { SiteEditor } from './editors/SiteEditor';
import { AboutEditor } from './editors/AboutEditor';
import { SkillsEditor } from './editors/SkillsEditor';
import { ArchivingEditor } from './editors/ArchivingEditor';
import { CareerEditor } from './editors/CareerEditor';
import { ProjectsEditor } from './editors/ProjectsEditor';
import { ReadOnlyViewer } from './editors/ReadOnlyViewer';

interface AdminSectionEditorProps {
  initialSection?: SectionKey;
  adminEmail: string;
}

interface SectionResponse {
  sectionKey: SectionKey;
  payload: unknown;
  updatedAt: string | null;
}

type Mode = 'form' | 'json';

type ValidationState =
  | { ok: true }
  | { ok: false; message: string };

const READ_ONLY_SECTIONS: ReadonlySet<SectionKey> = new Set([
  'project-portfolio-sync',
  'activity-heatmap',
]);

export default function AdminSectionEditor({
  initialSection = 'site',
  adminEmail,
}: AdminSectionEditorProps) {
  const [sectionKey, setSectionKey] = useState<SectionKey>(initialSection);
  const [payload, setPayload] = useState<unknown>(null);
  const [jsonText, setJsonText] = useState('');
  const [mode, setMode] = useState<Mode>('form');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const loadedForSectionRef = useRef<SectionKey | null>(null);

  const isReadOnly = READ_ONLY_SECTIONS.has(sectionKey);

  const prettyUpdatedAt = useMemo(() => {
    if (!updatedAt) return '—';
    const parsed = new Date(updatedAt);
    return Number.isNaN(parsed.getTime())
      ? updatedAt
      : parsed.toLocaleString('ko-KR', { hour12: false });
  }, [updatedAt]);

  const validation: ValidationState = useMemo(() => {
    if (isReadOnly) return { ok: true };
    const schema = sectionPayloadSchemaMap[sectionKey];
    let target: unknown;
    if (mode === 'json') {
      const parsedJson = safeParseJson(jsonText);
      if (parsedJson.error) {
        return { ok: false, message: parsedJson.error };
      }
      target = parsedJson.value;
    } else {
      target = payload;
    }
    const parsed = schema.safeParse(target);
    if (parsed.success) return { ok: true };
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path?.join('.') || '(root)';
    return { ok: false, message: `${path}: ${firstIssue?.message ?? 'invalid'}` };
  }, [sectionKey, mode, jsonText, payload, isReadOnly]);

  const loadSection = useCallback(
    async (nextSectionKey: SectionKey) => {
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
        setPayload(parsed.payload);
        setJsonText(JSON.stringify(parsed.payload, null, 2));
        setUpdatedAt(parsed.updatedAt);
        setIsDirty(false);
        loadedForSectionRef.current = nextSectionKey;
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : '섹션 로딩 실패');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadSection(sectionKey);
  }, [sectionKey, loadSection]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && isSectionKey(hash)) {
      setSectionKey(hash);
    }
  }, []);

  const handleSelectSection = (next: SectionKey) => {
    if (isDirty) {
      const confirmed = window.confirm('저장되지 않은 변경사항이 있습니다. 이동하시겠어요?');
      if (!confirmed) return;
    }
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`);
    }
    setSectionKey(next);
  };

  const handleFormChange = (next: unknown) => {
    setPayload(next);
    setJsonText(JSON.stringify(next, null, 2));
    setIsDirty(true);
    setSuccessMessage(null);
  };

  const handleJsonChange = (next: string) => {
    setJsonText(next);
    setIsDirty(true);
    setSuccessMessage(null);
    const parsed = safeParseJson(next);
    if (!parsed.error) {
      setPayload(parsed.value);
    }
  };

  const handleModeSwitch = (nextMode: Mode) => {
    if (nextMode === mode) return;
    if (nextMode === 'form') {
      const parsed = safeParseJson(jsonText);
      if (parsed.error) {
        setError(`JSON이 유효하지 않아 폼 모드로 전환할 수 없습니다: ${parsed.error}`);
        return;
      }
      setPayload(parsed.value);
      setError(null);
    } else {
      setJsonText(JSON.stringify(payload, null, 2));
      setError(null);
    }
    setMode(nextMode);
  };

  const handleReset = async () => {
    if (isDirty) {
      const confirmed = window.confirm('편집 중인 내용을 버리고 원본을 다시 불러올까요?');
      if (!confirmed) return;
    }
    await loadSection(sectionKey);
  };

  const handleSave = async () => {
    if (!validation.ok) {
      setError(`검증 실패: ${validation.message}`);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const targetPayload = mode === 'json' ? safeParseJson(jsonText).value : payload;

    try {
      const response = await fetch(`/api/admin/sections/${sectionKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: targetPayload }),
      });

      const body = (await response.json()) as
        | { ok: true; updatedAt: string | null }
        | { error: string; details?: unknown };

      if (!response.ok || !('ok' in body && body.ok)) {
        throw new Error('error' in body ? body.error : '저장에 실패했습니다.');
      }

      setUpdatedAt(body.updatedAt);
      setSuccessMessage('저장되었습니다.');
      setIsDirty(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const meta = sectionMeta[sectionKey];

  return (
    <AdminShell
      currentSection={sectionKey}
      onSelectSection={handleSelectSection}
      adminEmail={adminEmail}
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {sectionKey}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-neutral-900">{meta.label}</h2>
            <p className="mt-0.5 text-sm text-neutral-500">{meta.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <div className="inline-flex overflow-hidden rounded-md border border-neutral-300 bg-white">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('form')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === 'form'
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <FormInput className="h-3.5 w-3.5" />폼
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('json')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 border-l border-neutral-300 px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === 'json'
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />JSON
                </button>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              disabled={isLoading || isSaving}
              iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
            >
              새로고침
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs">
          <StatusPill
            ok={validation.ok}
            okLabel="검증 통과"
            failLabel={validation.ok ? '' : validation.message}
          />
          <span className="text-neutral-500">
            수정일: <span className="font-medium text-neutral-700">{prettyUpdatedAt}</span>
          </span>
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              저장되지 않은 변경사항
            </span>
          )}
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-5 py-12 text-center text-sm text-neutral-500">
              불러오는 중...
            </div>
          ) : isReadOnly ? (
            <ReadOnlyViewer
              title={meta.label}
              description={meta.description}
              payload={payload}
              syncHint={
                sectionKey === 'project-portfolio-sync'
                  ? 'sync-projects 스크립트 실행 시 갱신됩니다.'
                  : 'activity-heatmap 스크립트 실행 시 갱신됩니다.'
              }
            />
          ) : mode === 'form' ? (
            renderFormEditor(sectionKey, payload, handleFormChange)
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
                <p className="text-xs font-medium text-neutral-600">JSON 편집 (고급)</p>
                <p className="text-[11px] text-neutral-400">{jsonText.length} chars</p>
              </div>
              <textarea
                value={jsonText}
                onChange={(event) => handleJsonChange(event.target.value)}
                spellCheck={false}
                className="h-[560px] w-full resize-y rounded-b-xl bg-neutral-950 p-4 font-mono text-[12px] leading-relaxed text-neutral-100 outline-none"
              />
            </div>
          )}
        </div>

        {(error || successMessage) && (
          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
              error
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {error ? (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            <span>{error || successMessage}</span>
          </div>
        )}

        {!isReadOnly && (
          <div className="sticky bottom-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading || !validation.ok}
              iconLeft={<Save className="h-4 w-4" />}
              className="shadow-lg"
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function renderFormEditor(
  sectionKey: SectionKey,
  payload: unknown,
  onChange: (next: unknown) => void,
) {
  if (payload === null || payload === undefined) return null;

  switch (sectionKey) {
    case 'site':
      return (
        <SiteEditor
          value={payload as Parameters<typeof SiteEditor>[0]['value']}
          onChange={onChange}
        />
      );
    case 'about':
      return (
        <AboutEditor
          value={payload as Parameters<typeof AboutEditor>[0]['value']}
          onChange={onChange}
        />
      );
    case 'skills':
      return (
        <SkillsEditor
          value={payload as Parameters<typeof SkillsEditor>[0]['value']}
          onChange={onChange}
        />
      );
    case 'archiving':
      return (
        <ArchivingEditor
          value={payload as Parameters<typeof ArchivingEditor>[0]['value']}
          onChange={onChange}
        />
      );
    case 'career':
      return (
        <CareerEditor
          value={payload as Parameters<typeof CareerEditor>[0]['value']}
          onChange={onChange}
        />
      );
    case 'projects':
      return (
        <ProjectsEditor
          value={payload as Parameters<typeof ProjectsEditor>[0]['value']}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}

function StatusPill({
  ok,
  okLabel,
  failLabel,
}: {
  ok: boolean;
  okLabel: string;
  failLabel: string;
}) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
        <Check className="h-3 w-3" />
        {okLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-[360px] items-center gap-1 truncate rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{failLabel}</span>
    </span>
  );
}

function safeParseJson(text: string): { value: unknown; error?: string } {
  try {
    return { value: JSON.parse(text) };
  } catch (caughtError) {
    return {
      value: null,
      error: caughtError instanceof Error ? caughtError.message : 'JSON parse error',
    };
  }
}
