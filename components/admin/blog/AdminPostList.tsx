'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { BlogPostSummary } from '@/lib/blog/types';
import { formatPostDate } from '@/lib/blog/format';
import { Button } from '../ui/Button';

interface AdminPostListProps {
  posts: BlogPostSummary[];
}

export default function AdminPostList({ posts }: AdminPostListProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (slug: string) => {
    const ok = window.confirm(`'${slug}' 글을 삭제할까요? 댓글도 함께 삭제됩니다.`);
    if (!ok) return;
    setPending(slug);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">글 목록</h2>
        <Link href="/admin/blog/new">
          <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>
            새 글
          </Button>
        </Link>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-500">
          아직 작성된 글이 없습니다. &lsquo;새 글&rsquo; 버튼으로 첫 글을 작성해보세요.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      post.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {post.status}
                  </span>
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {post.title}
                  </p>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  <span className="font-mono">{post.slug}</span> · {formatPostDate(post.publishedAt) || '미발행'} · 조회 {post.viewCount} · ♥ {post.likeCount} · 💬 {post.commentCount}
                </p>
                {post.tags.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {post.status === 'published' && (
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" iconLeft={<ExternalLink className="h-3.5 w-3.5" />}>
                      열기
                    </Button>
                  </Link>
                )}
                <Link href={`/admin/blog/${post.slug}/edit`}>
                  <Button variant="secondary" size="sm" iconLeft={<Pencil className="h-3.5 w-3.5" />}>
                    편집
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                  disabled={pending === post.slug}
                  onClick={() => handleDelete(post.slug)}
                >
                  {pending === post.slug ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
