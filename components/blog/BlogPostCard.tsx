import Link from 'next/link';
import { Calendar, Eye, Heart, MessageCircle, Tag } from 'lucide-react';
import { formatPostDate } from '@/lib/blog/format';
import { tagPath } from '@/lib/blog/tags';
import type { BlogPostSummary } from '@/lib/blog/types';

interface BlogPostCardProps {
  post: BlogPostSummary;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-400 hover:shadow-sm">
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="flex flex-col gap-4 md:flex-row">
          {post.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail}
              alt={`${post.title} 대표 이미지`}
              className="h-32 w-full rounded-lg object-cover md:h-28 md:w-44"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 transition group-hover:text-neutral-700">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
              {post.summary}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatPostDate(post.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.viewCount.toLocaleString('ko-KR')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post.likeCount.toLocaleString('ko-KR')}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.commentCount.toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={tagPath(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 hover:bg-neutral-200"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
