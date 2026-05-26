import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BlogPostList from '@/components/blog/BlogPostList';
import BlogTagNav from '@/components/blog/BlogTagNav';
import { listAllTags, listPublishedPosts } from '@/lib/blog/server';
import { describeTag, findTagBySlug, tagPath } from '@/lib/blog/tags';
import { getSiteData } from '@/lib/portfolio-data/server';
import { absoluteImageUrl, absoluteUrl } from '@/lib/seo/url';

export const revalidate = 60;

interface BlogTagPageProps {
  params: Promise<{ tag: string }>;
}

const getTagPageData = cache(async (rawTagSlug: string) => {
  const [site, tags] = await Promise.all([getSiteData(), listAllTags()]);
  const tag = findTagBySlug(tags, rawTagSlug);
  if (!tag) return { site, tags, tag: null, posts: [] };

  const posts = await listPublishedPosts({ tag });
  return { site, tags, tag, posts };
});

export async function generateMetadata({
  params,
}: BlogTagPageProps): Promise<Metadata> {
  const { tag: rawTagSlug } = await params;
  const { site, tag, posts } = await getTagPageData(rawTagSlug);

  if (!tag || posts.length === 0) {
    return {
      title: '태그를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const description = describeTag(tag, posts.length);
  const canonicalPath = tagPath(tag);
  const canonicalUrl = absoluteUrl(canonicalPath, site.config);
  const imageUrl = absoluteImageUrl(null, site.config);

  return {
    title: `${tag} 태그 글 | ${site.config.name}`,
    description,
    keywords: [tag, `${tag} 개발`, `${tag} 블로그`, site.hero.name],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${tag} 태그 글`,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: site.config.name,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tag} 태그 글`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BlogTagPage({ params }: BlogTagPageProps) {
  const { tag: rawTagSlug } = await params;
  const { site, tags, tag, posts } = await getTagPageData(rawTagSlug);

  if (!tag || posts.length === 0) notFound();

  const description = describeTag(tag, posts.length);
  const canonicalUrl = absoluteUrl(tagPath(tag), site.config);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${tag} 태그 글`,
      description,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'Blog',
        name: `${site.config.name} Blog`,
        url: absoluteUrl('/blog', site.config),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${tag} 태그 글 목록`,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/blog/${post.slug}`, site.config),
        name: post.title,
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" /> 블로그 목록
        </Link>

        <header className="mt-6 mb-8">
          <p className="text-sm font-medium text-neutral-500">Blog Tag</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            {tag} 태그 글
          </h1>
          <p className="mt-3 text-gray-600">{description}</p>
        </header>

        <BlogTagNav activeTag={tag} tags={tags} />
        <BlogPostList posts={posts} />
      </div>
    </div>
  );
}
