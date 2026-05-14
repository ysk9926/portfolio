'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircle, Pencil, Reply, Trash2 } from 'lucide-react';
import type { BlogCommentNode } from '@/lib/blog/types';
import { formatCommentTime } from '@/lib/blog/format';

interface CommentSectionProps {
  slug: string;
  initialComments: BlogCommentNode[];
}

const COMMENT_LIKE_KEY = (id: number) => `blog:like:comment:${id}`;

const countAll = (nodes: BlogCommentNode[]): number =>
  nodes.reduce((acc, n) => acc + 1 + countAll(n.replies), 0);

export default function CommentSection({ slug, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const total = useMemo(() => countAll(initialComments), [initialComments]);

  const refresh = () => router.refresh();

  return (
    <section className="mt-14 border-t border-neutral-200 pt-10">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <MessageCircle className="h-5 w-5" />
        댓글 {total}
      </h2>

      <div className="mt-6">
        <CommentForm slug={slug} parentId={null} onSubmitted={refresh} />
      </div>

      <ul className="mt-10 space-y-6">
        {initialComments.length === 0 ? (
          <li className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
            아직 댓글이 없습니다. 첫 댓글을 남겨주세요.
          </li>
        ) : (
          initialComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              slug={slug}
              depth={0}
              onChanged={refresh}
            />
          ))
        )}
      </ul>
    </section>
  );
}

interface CommentItemProps {
  comment: BlogCommentNode;
  slug: string;
  depth: number;
  onChanged: () => void;
}

function CommentItem({ comment, slug, depth, onChanged }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <li>
      <article
        className={`rounded-xl border border-neutral-200 bg-white p-4 ${
          comment.isDeleted ? 'opacity-70' : ''
        }`}
      >
        <header className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{comment.nickname}</span>
            <span className="text-xs text-neutral-500">{formatCommentTime(comment.createdAt)}</span>
          </div>
          {!comment.isDeleted && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100"
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil className="h-3 w-3" /> 수정
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100"
                onClick={() => setDeleting((v) => !v)}
              >
                <Trash2 className="h-3 w-3" /> 삭제
              </button>
            </div>
          )}
        </header>

        {comment.isDeleted ? (
          <p className="mt-3 text-sm italic text-neutral-500">삭제된 댓글입니다.</p>
        ) : editing ? (
          <EditForm
            comment={comment}
            onDone={() => {
              setEditing(false);
              onChanged();
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {comment.body}
          </p>
        )}

        {deleting && !comment.isDeleted && (
          <DeleteForm
            commentId={comment.id}
            onDone={() => {
              setDeleting(false);
              onChanged();
            }}
            onCancel={() => setDeleting(false)}
          />
        )}

        {!comment.isDeleted && (
          <footer className="mt-3 flex items-center gap-3">
            <CommentLike commentId={comment.id} initialCount={comment.likeCount} />
            {depth < 1 && (
              <button
                type="button"
                onClick={() => setShowReply((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
              >
                <Reply className="h-3 w-3" />
                {showReply ? '답글 닫기' : '답글'}
              </button>
            )}
          </footer>
        )}

        {showReply && depth < 1 && (
          <div className="mt-4 rounded-lg bg-neutral-50 p-3">
            <CommentForm
              slug={slug}
              parentId={comment.id}
              compact
              onSubmitted={() => {
                setShowReply(false);
                onChanged();
              }}
            />
          </div>
        )}
      </article>

      {comment.replies.length > 0 && (
        <ul className="mt-3 space-y-3 pl-6 md:pl-10">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              slug={slug}
              depth={depth + 1}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface CommentFormProps {
  slug: string;
  parentId: number | null;
  compact?: boolean;
  onSubmitted: () => void;
}

function CommentForm({ slug, parentId, compact, onSubmitted }: CommentFormProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, parentId, nickname, password, body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? '댓글 등록에 실패했습니다.');
      setBody('');
      setPassword('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={50}
          required
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (수정/삭제 시 필요)"
          minLength={4}
          maxLength={50}
          required
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? '답글을 입력하세요.' : '댓글을 입력하세요.'}
        maxLength={5000}
        required
        rows={compact ? 3 : 4}
        className="w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  );
}

interface EditFormProps {
  comment: BlogCommentNode;
  onDone: () => void;
  onCancel: () => void;
}

function EditForm({ comment, onDone, onCancel }: EditFormProps) {
  const [password, setPassword] = useState('');
  const [body, setBody] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/blog/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? '수정에 실패했습니다.');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        minLength={4}
        maxLength={50}
        required
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={5000}
        required
        className="w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}

interface DeleteFormProps {
  commentId: number;
  onDone: () => void;
  onCancel: () => void;
}

function DeleteForm({ commentId, onDone, onCancel }: DeleteFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/blog/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? '삭제에 실패했습니다.');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-md bg-rose-50 p-3">
      <p className="text-xs text-rose-700">댓글 삭제: 비밀번호를 입력하세요.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={4}
        maxLength={50}
        required
        className="w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
      />
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {submitting ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </form>
  );
}

interface CommentLikeProps {
  commentId: number;
  initialCount: number;
}

function CommentLike({ commentId, initialCount }: CommentLikeProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setLiked(window.localStorage.getItem(COMMENT_LIKE_KEY(commentId)) === '1');
    } catch {
      // ignore
    }
  }, [commentId]);

  const handleClick = async () => {
    if (pending) return;
    const delta = liked ? -1 : 1;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(Math.max(0, count + delta));
    setPending(true);
    try {
      const res = await fetch(`/api/blog/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const data = (await res.json()) as { likeCount?: number };
      if (!res.ok) throw new Error('like failed');
      if (typeof data.likeCount === 'number') setCount(data.likeCount);
      try {
        if (delta === 1) window.localStorage.setItem(COMMENT_LIKE_KEY(commentId), '1');
        else window.localStorage.removeItem(COMMENT_LIKE_KEY(commentId));
      } catch {
        // ignore
      }
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
        liked ? 'bg-rose-100 text-rose-600' : 'text-neutral-500 hover:bg-neutral-100'
      } disabled:opacity-60`}
    >
      <Heart className={`h-3 w-3 ${liked ? 'fill-current' : ''}`} />
      {count.toLocaleString()}
    </button>
  );
}
