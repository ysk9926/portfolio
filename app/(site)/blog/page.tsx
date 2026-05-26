import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import BlogPostList from '@/components/blog/BlogPostList';
import BlogTagNav from '@/components/blog/BlogTagNav';
import { listAllTags, listPublishedPosts } from '@/lib/blog/server';
import { tagPath } from '@/lib/blog/tags';
import { getSiteData } from '@/lib/portfolio-data/server';
import { absoluteImageUrl, absoluteUrl } from '@/lib/seo/url';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  const title = `개발 블로그 | ${site.config.name}`;
  const description =
    'Next.js, React, TypeScript, AWS, 백엔드, 운영 경험을 실제 프로젝트 중심으로 정리한 개발 블로그입니다.';
  const imageUrl = absoluteImageUrl(null, site.config);

  return {
    title,
    description,
    keywords: [
      '개발 블로그',
      'Next.js',
      'React',
      'TypeScript',
      'AWS',
      site.hero.name,
    ],
    alternates: {
      canonical: '/blog',
      types: {
        'application/rss+xml': '/blog/rss.xml',
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: absoluteUrl('/blog', site.config),
      siteName: site.config.name,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

interface BlogIndexProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexProps) {
  const params = await searchParams;
  const legacyTag = params.tag?.trim();
  if (legacyTag) {
    redirect(tagPath(legacyTag));
  }

  const [posts, tags] = await Promise.all([listPublishedPosts(), listAllTags()]);

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-600">
            개발하면서 배우거나 정리한 내용을 기록합니다.
          </p>
        </header>

        <BlogTagNav tags={tags} />

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-sm text-neutral-500">
            아직 작성된 글이 없습니다.
          </div>
        ) : (
          <BlogPostList posts={posts} />
        )}
      </div>
    </div>
  );
}
