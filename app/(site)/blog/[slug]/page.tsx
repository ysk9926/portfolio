import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Eye, MessageCircle, Tag } from 'lucide-react';
import BlogMarkdown from '@/components/blog/BlogMarkdown';
import BlogToc from '@/components/blog/BlogToc';
import BlogViewTracker from '@/components/blog/BlogViewTracker';
import CommentSection from '@/components/blog/CommentSection';
import PostLikeButton from '@/components/blog/PostLikeButton';
import { getPostBySlug, listCommentsForPost } from '@/lib/blog/server';
import { formatPostDate } from '@/lib/blog/format';
import { estimateReadingMinutes, extractToc } from '@/lib/blog/toc';
import { getSiteData } from '@/lib/portfolio-data/server';

export const revalidate = 60;

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Not Found' };

  const site = await getSiteData();
  const ogImage = post.thumbnail || site.config.ogImage;
  return {
    title: `${post.title} | ${site.config.name}`,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      url: `${site.config.url}/blog/${post.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      publishedTime: post.publishedAt ?? undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [comments, site] = await Promise.all([
    listCommentsForPost(post.id),
    getSiteData(),
  ]);

  const toc = extractToc(post.body);
  const readingMinutes = estimateReadingMinutes(post.body);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    image: post.thumbnail ? [post.thumbnail] : undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: site.hero.name,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${site.config.url}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogViewTracker slug={post.slug} />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 xl:grid-cols-[1fr_240px]">
        <article className="min-w-0">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> 블로그 목록
          </Link>

          <header className="mt-6">
            <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-base text-gray-600">{post.summary}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatPostDate(post.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> 약 {readingMinutes}분
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {post.viewCount.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {post.commentCount.toLocaleString()}
              </span>
              {post.tags.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 hover:bg-neutral-200"
                    >
                      <Tag className="h-2.5 w-2.5" /> {tag}
                    </Link>
                  ))}
                </span>
              )}
            </div>

            {post.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.thumbnail}
                alt={post.title}
                className="mt-8 w-full rounded-xl object-cover"
              />
            )}
          </header>

          <div className="mt-10">
            <BlogMarkdown content={post.body} />
          </div>

          <div className="mt-12 flex justify-center">
            <PostLikeButton slug={post.slug} initialCount={post.likeCount} />
          </div>

          <CommentSection slug={post.slug} initialComments={comments} />
        </article>

        <BlogToc entries={toc} />
      </div>
    </div>
  );
}
