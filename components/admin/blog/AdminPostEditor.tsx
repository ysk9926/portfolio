'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Image as ImageIcon, Save, Trash2 } from 'lucide-react';
import BlogMarkdown from '@/components/blog/BlogMarkdown';
import { blogPostInputSchema, BlogPostDetail, BlogPostStatus } from '@/lib/blog/types';
import { Button } from '../ui/Button';
import { Field, TextArea, TextInput } from '../ui/Field';

interface AdminPostEditorProps {
  initial?: BlogPostDetail;
  mode: 'create' | 'edit';
}

interface FormState {
  slug: string;
  title: string;
  summary: string;
  thumbnail: string;
  body: string;
  status: BlogPostStatus;
  publishedAt: string;
  tagsText: string;
}

const toFormState = (post?: BlogPostDetail): FormState => ({
  slug: post?.slug ?? '',
  title: post?.title ?? '',
  summary: post?.summary ?? '',
  thumbnail: post?.thumbnail ?? '',
  body: post?.body ?? '',
  status: post?.status ?? 'draft',
  publishedAt: post?.publishedAt ?? '',
  tagsText: (post?.tags ?? []).join(', '),
});

export default function AdminPostEditor({ initial, mode }: AdminPostEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(true);

  const tags = useMemo(
    () =>
      form.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [form.tagsText],
  );

  useEffect(() => {
    if (mode === 'create' && !form.slug && form.title) {
      const auto = form.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80);
      if (auto) setForm((prev) => ({ ...prev, slug: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const insertAtCursor = (snippet: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, body: prev.body + snippet }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = form.body.slice(0, start) + snippet + form.body.slice(end);
    setForm((prev) => ({ ...prev, body: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? '업로드 실패');
      insertAtCursor(`\n![](${data.url})\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await handleUpload(file);
  };

  const handleSetThumbnail = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? '업로드 실패');
      update('thumbnail', data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim(),
      thumbnail: form.thumbnail.trim() || null,
      body: form.body,
      status: form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      tags,
    };

    const parsed = blogPostInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${issue?.path?.join('.') ?? '입력'}: ${issue?.message ?? '유효하지 않음'}`);
      return;
    }

    setSaving(true);
    try {
      const endpoint =
        mode === 'create'
          ? '/api/admin/blog/posts'
          : `/api/admin/blog/posts/${encodeURIComponent(initial!.slug)}`;
      const res = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? '저장 실패');

      setSuccess('저장되었습니다.');
      if (mode === 'create') {
        router.push(`/admin/blog/${data.slug}/edit`);
        router.refresh();
      } else if (data.slug && data.slug !== initial!.slug) {
        router.push(`/admin/blog/${data.slug}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {mode === 'create' ? '새 글' : '글 편집'}
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-neutral-900">
            {form.title || '제목 없음'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            iconLeft={<Eye className="h-3.5 w-3.5" />}
          >
            {showPreview ? '미리보기 끄기' : '미리보기 켜기'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            iconLeft={<Save className="h-4 w-4" />}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      {success && !error && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {success}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <Field label="제목" required>
          <TextInput value={form.title} onChange={(v) => update('title', v)} />
        </Field>
        <Field label="슬러그" required hint="URL: /blog/{슬러그} (영문 소문자/숫자/하이픈)">
          <TextInput value={form.slug} onChange={(v) => update('slug', v)} />
        </Field>
        <Field label="요약" required hint="목록과 OG description에 사용" className="md:col-span-2">
          <TextArea value={form.summary} onChange={(v) => update('summary', v)} rows={2} />
        </Field>
        <Field label="태그" hint="쉼표(,)로 구분 — 예: nextjs, supabase">
          <TextInput value={form.tagsText} onChange={(v) => update('tagsText', v)} />
        </Field>
        <Field label="발행 상태">
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value as BlogPostStatus)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          >
            <option value="draft">draft (비공개)</option>
            <option value="published">published (공개)</option>
          </select>
        </Field>
        <Field label="발행일 (선택)" hint="비워두면 처음 published 시점으로 자동 설정">
          <input
            type="datetime-local"
            value={form.publishedAt ? form.publishedAt.slice(0, 16) : ''}
            onChange={(e) =>
              update('publishedAt', e.target.value ? new Date(e.target.value).toISOString() : '')
            }
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </Field>
        <Field label="썸네일 URL" className="md:col-span-2" hint="목록 카드와 OG 이미지에 사용">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <TextInput value={form.thumbnail} onChange={(v) => update('thumbnail', v)} />
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
              <ImageIcon className="h-3.5 w-3.5" />
              업로드
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleSetThumbnail}
                disabled={uploading}
              />
            </label>
            {form.thumbnail && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update('thumbnail', '')}
                iconLeft={<Trash2 className="h-3.5 w-3.5" />}
              >
                제거
              </Button>
            )}
          </div>
          {form.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.thumbnail}
              alt=""
              className="mt-2 h-32 rounded-md object-cover"
            />
          )}
        </Field>
      </div>

      <div className={`grid gap-4 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <p className="text-xs font-semibold text-neutral-600">본문 (마크다운)</p>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50">
              <ImageIcon className="h-3 w-3" />
              {uploading ? '업로드 중...' : '이미지 삽입'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
          <textarea
            ref={bodyRef}
            value={form.body}
            onChange={(e) => update('body', e.target.value)}
            spellCheck={false}
            placeholder="# 글 본문..."
            className="min-h-[600px] w-full resize-y rounded-b-xl bg-neutral-950 p-4 font-mono text-[13px] leading-relaxed text-neutral-100 outline-none"
          />
        </div>
        {showPreview && (
          <div className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-3 py-2">
              <p className="text-xs font-semibold text-neutral-600">미리보기</p>
            </div>
            <div className="max-h-[700px] overflow-y-auto px-5 py-4">
              <BlogMarkdown content={form.body || '_본문 미리보기가 여기에 표시됩니다._'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPostEditorChrome({
  initial,
  mode,
}: {
  initial?: BlogPostDetail;
  mode: 'create' | 'edit';
}) {
  return <AdminPostEditor initial={initial} mode={mode} />;
}
