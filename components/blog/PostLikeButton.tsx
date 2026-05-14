'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface PostLikeButtonProps {
  slug: string;
  initialCount: number;
}

const STORAGE_KEY = (slug: string) => `blog:like:post:${slug}`;

export default function PostLikeButton({ slug, initialCount }: PostLikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setLiked(window.localStorage.getItem(STORAGE_KEY(slug)) === '1');
    } catch {
      // ignore
    }
  }, [slug]);

  const handleClick = async () => {
    if (pending) return;
    const delta = liked ? -1 : 1;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(Math.max(0, count + delta));
    setPending(true);
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const body = (await res.json()) as { likeCount?: number; error?: string };
      if (!res.ok) throw new Error(body.error ?? '실패');
      if (typeof body.likeCount === 'number') setCount(body.likeCount);
      try {
        if (delta === 1) window.localStorage.setItem(STORAGE_KEY(slug), '1');
        else window.localStorage.removeItem(STORAGE_KEY(slug));
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
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
        liked
          ? 'border-rose-500 bg-rose-500 text-white'
          : 'border-neutral-300 bg-white text-neutral-700 hover:border-rose-500 hover:text-rose-500'
      }`}
    >
      <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
      좋아요 {count.toLocaleString()}
    </button>
  );
}
