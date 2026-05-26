import Link from 'next/link';
import { Tag } from 'lucide-react';
import { tagPath } from '@/lib/blog/tags';

interface BlogTagNavProps {
  activeTag?: string;
  tags: string[];
}

export default function BlogTagNav({ activeTag, tags }: BlogTagNavProps) {
  if (tags.length === 0) return null;

  return (
    <nav aria-label="블로그 태그" className="mb-8 flex flex-wrap items-center gap-2">
      <Link
        href="/blog"
        className={`rounded-full border px-3 py-1 text-xs transition ${
          !activeTag
            ? 'border-neutral-900 bg-neutral-900 text-white'
            : 'border-neutral-300 text-neutral-700 hover:border-neutral-500'
        }`}
      >
        전체
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={tagPath(tag)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
            activeTag === tag
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-300 text-neutral-700 hover:border-neutral-500'
          }`}
        >
          <Tag className="h-3 w-3" />
          {tag}
        </Link>
      ))}
    </nav>
  );
}
