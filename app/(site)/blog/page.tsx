import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Eye, Heart, MessageCircle, Tag } from 'lucide-react';
import { listAllTags, listPublishedPosts } from '@/lib/blog/server';
import { formatPostDate } from '@/lib/blog/format';
import { getSiteData } from '@/lib/portfolio-data/server';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  return {
    title: `Blog | ${site.config.name}`,
    description: '개발 학습과 프로젝트 회고를 기록합니다.',
    alternates: { canonical: '/blog' },
  };
}

interface BlogIndexProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexProps) {
  const params = await searchParams;
  const activeTag = params.tag?.trim() || undefined;
  const [posts, tags] = await Promise.all([
    listPublishedPosts({ tag: activeTag }),
    listAllTags(),
  ]);

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-600">
            개발하면서 배우거나 정리한 내용을 기록합니다.
          </p>
        </header>

        {tags.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
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
                href={`/blog?tag=${encodeURIComponent(tag)}`}
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
          </div>
        )}

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-sm text-neutral-500">
            {activeTag ? '해당 태그의 글이 아직 없습니다.' : '아직 작성된 글이 없습니다.'}
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-400 hover:shadow-sm"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col gap-4 md:flex-row">
                    {post.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail}
                        alt=""
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
                          {post.viewCount.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likeCount.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.commentCount.toLocaleString()}
                        </span>
                        {post.tags.length > 0 && (
                          <span className="flex flex-wrap gap-1">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
