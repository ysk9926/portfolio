'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { formatCommentTime } from '@/lib/blog/format';
import { Button } from '../ui/Button';

export interface AdminCommentRow {
  id: number;
  postSlug: string;
  postTitle: string;
  nickname: string;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  parentId: number | null;
}

interface AdminCommentListProps {
  comments: AdminCommentRow[];
}

export default function AdminCommentList({ comments }: AdminCommentListProps) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    const ok = window.confirm('댓글을 삭제할까요?');
    if (!ok) return;
    setPending(id);
    setError(null);
    try {
      const res = await fetch(`/api/blog/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? '삭제 실패');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">댓글 관리</h2>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-500">
          아직 등록된 댓글이 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-xl border border-neutral-200 bg-white p-4 ${
                comment.isDeleted ? 'opacity-60' : ''
              }`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-neutral-900">{comment.nickname}</span>
                  <span className="text-neutral-500">{formatCommentTime(comment.createdAt)}</span>
                  {comment.parentId && (
                    <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                      답글
                    </span>
                  )}
                  {comment.isDeleted && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">
                      삭제됨
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/blog/${comment.postSlug}`} target="_blank">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<ExternalLink className="h-3 w-3" />}
                    >
                      {comment.postTitle}
                    </Button>
                  </Link>
                  {!comment.isDeleted && (
                    <Button
                      variant="danger"
                      size="sm"
                      iconLeft={<Trash2 className="h-3 w-3" />}
                      disabled={pending === comment.id}
                      onClick={() => handleDelete(comment.id)}
                    >
                      {pending === comment.id ? '삭제 중...' : '삭제'}
                    </Button>
                  )}
                </div>
              </header>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                {comment.body || <span className="italic text-neutral-500">(내용 없음)</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
