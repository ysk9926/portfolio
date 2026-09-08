'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

interface BlogViewTrackerProps {
  slug: string;
}

const VIEW_KEY = (slug: string) => `blog:view:${slug}`;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function BlogViewTracker({ slug }: BlogViewTrackerProps) {
  const { enabled } = useAnalytics();
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    let key: string;
    try {
      key = VIEW_KEY(slug);
      const last = window.localStorage.getItem(key);
      if (last) {
        const lastTime = Number.parseInt(last, 10);
        if (Number.isFinite(lastTime) && Date.now() - lastTime < ONE_DAY_MS) {
          return;
        }
      }
    } catch {
      return;
    }
    const controller = new AbortController();
    fetch(`/api/blog/posts/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      signal: controller.signal,
    })
      .then((res) => {
        if (res.ok && !controller.signal.aborted) {
          try {
            window.localStorage.setItem(VIEW_KEY(slug), Date.now().toString());
          } catch {
            // ignore quota errors
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slug, enabled]);

  return null;
}
