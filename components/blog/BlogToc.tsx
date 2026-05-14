'use client';

import { useEffect, useState } from 'react';
import type { TocEntry } from '@/lib/blog/toc';

interface BlogTocProps {
  entries: TocEntry[];
}

export default function BlogToc({ entries }: BlogTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    entries.forEach((entry) => {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <aside className="hidden xl:block">
      <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          목차
        </p>
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${entry.id}`}
                className={`block truncate rounded px-2 py-1 transition-colors ${
                  activeId === entry.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
