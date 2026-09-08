import { cache } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  User,
} from 'lucide-react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { getPortfolioPageData } from '@/lib/portfolio-data/server';
import {
  findProjectBySlug,
  getProjectSummary,
  getProjectUpdatedDate,
  mergePortfolioProjects,
  projectPath,
} from '@/lib/projects/portfolio';
import { absoluteImageUrl, absoluteUrl } from '@/lib/seo/url';

export const revalidate = 60;

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

const getProjectPageData = cache(async (slug: string) => {
  const data = await getPortfolioPageData();
  const projects = mergePortfolioProjects(
    data.projects,
    data.projectPortfolioSync,
  );
  const project = findProjectBySlug(projects, slug);

  return {
    site: data.site,
    project,
  };
});

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { site, project } = await getProjectPageData(slug);

  if (!project) {
    return {
      title: '프로젝트를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = projectPath(project);
  const title = `${project.title} | ${site.hero.name} 프로젝트`;
  const description = getProjectSummary(project);
  const imageUrl = absoluteImageUrl(project.thumbnail, site.config);

  return {
    title,
    description,
    keywords: [
      project.title,
      site.hero.name,
      'ysk9926',
      '개발자 포트폴리오',
      ...project.techStack,
      ...project.features.slice(0, 6),
    ],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: 'article',
      url: absoluteUrl(canonicalPath, site.config),
      siteName: site.config.name,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      locale: 'ko_KR',
      modifiedTime: getProjectUpdatedDate(project)?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const { site, project } = await getProjectPageData(slug);

  if (!project) notFound();

  const canonicalPath = projectPath(project);
  const canonicalUrl = absoluteUrl(canonicalPath, site.config);
  const imageUrl = absoluteImageUrl(project.thumbnail, site.config);
  const summary = getProjectSummary(project);
  const updatedDate = getProjectUpdatedDate(project);
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': project.githubUrl ? 'SoftwareSourceCode' : 'CreativeWork',
      name: project.title,
      headline: project.title,
      description: summary,
      url: canonicalUrl,
      image: [imageUrl],
      dateModified: updatedDate?.toISOString(),
      creator: {
        '@type': 'Person',
        '@id': absoluteUrl('/#person', site.config),
        name: site.hero.name,
        alternateName: 'ysk9926',
        url: absoluteUrl('/', site.config),
      },
      author: {
        '@type': 'Person',
        '@id': absoluteUrl('/#person', site.config),
        name: site.hero.name,
        alternateName: 'ysk9926',
        url: absoluteUrl('/', site.config),
      },
      codeRepository: project.githubUrl || undefined,
      programmingLanguage: project.techStack,
      keywords: project.techStack.join(', '),
      about: project.features,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: site.hero.name,
          item: absoluteUrl('/', site.config),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Projects',
          item: absoluteUrl('/#projects', site.config),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: project.title,
          item: canonicalUrl,
        },
      ],
    },
  ];

  return (
    <article data-analytics-project={project.id} data-analytics-surface="detail" className="ai-cream min-h-screen pt-24 pb-20 text-ai-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-5xl px-4">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-1 font-mono text-xs text-neutral-500 hover:text-ai-accent"
        >
          <ArrowLeft className="h-4 w-4" /> 프로젝트 목록
        </Link>

        <header className="mt-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {project.portfolioSync?.status && (
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                {project.portfolioSync.status}
              </span>
            )}
            {project.isMain && (
              <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700">
                주요 프로젝트
              </span>
            )}
            {project.portfolioSync?.track && (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {project.portfolioSync.track}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
            {project.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-gray-600 md:text-lg">
            {summary}
          </p>

          <dl className="paper-card mt-8 grid gap-3 rounded-2xl p-5 text-sm text-neutral-700 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <dt className="font-medium text-neutral-900">기간</dt>
              <dd>{project.period}</dd>
            </div>
            {project.portfolioSync?.role && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-neutral-500" />
                <dt className="font-medium text-neutral-900">역할</dt>
                <dd>{project.portfolioSync.role}</dd>
              </div>
            )}
            {project.portfolioSync?.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neutral-500" />
                <dt className="font-medium text-neutral-900">구분</dt>
                <dd>{project.portfolioSync.company}</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-neutral-500" />
              <dt className="font-medium text-neutral-900">스택</dt>
              <dd>{project.techStack.slice(0, 4).join(', ')}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl} data-analytics-target="github" data-analytics-project-id={project.id}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ai-ink px-5 py-2 text-sm font-medium text-white transition hover:bg-ai-accent"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
            {project.deployUrl && (
              <a
                href={project.deployUrl} data-analytics-target="demo" data-analytics-project-id={project.id}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ai-ink/20 px-5 py-2 text-sm font-medium text-ai-ink transition hover:border-ai-accent hover:text-ai-accent"
              >
                <ExternalLink className="h-4 w-4" />
                배포 사이트
              </a>
            )}
          </div>
        </header>

        <section className="mt-10">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-900">
            {project.thumbnail ? (
              <Image
                src={project.thumbnail}
                alt={`${project.title} 대표 화면`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-lg font-semibold text-white/35">
                {project.title}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-8">
            {project.star ? (
              <>
                <ProjectSection title="프로젝트 배경">
                  <MarkdownRenderer content={project.star.background} />
                </ProjectSection>
                <ProjectSection title="핵심 구현">
                  <MarkdownRenderer content={project.star.solutions} />
                </ProjectSection>
                <ProjectSection title="성과">
                  <MarkdownRenderer content={project.star.results} />
                </ProjectSection>
                {project.star.troubleshooting && (
                  <ProjectSection title="트러블슈팅">
                    <MarkdownRenderer content={project.star.troubleshooting} />
                  </ProjectSection>
                )}
              </>
            ) : (
              <ProjectSection title="프로젝트 소개">
                <p className="leading-7 text-gray-700">{project.description}</p>
              </ProjectSection>
            )}

            {project.screenshots.length > 0 && (
              <ProjectSection title="화면 구성">
                <div className="grid gap-4 md:grid-cols-2">
                  {project.screenshots.map((screenshot, index) => (
                    <div
                      key={screenshot}
                      className="relative aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
                    >
                      <Image
                        src={screenshot}
                        alt={`${project.title} 화면 ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </ProjectSection>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-base font-bold text-neutral-950">주요 기능</h2>
              <ul className="mt-4 space-y-2">
                {project.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm leading-6 text-neutral-700"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-neutral-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-base font-bold text-neutral-950">기술 스택</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </article>
  );
}

function ProjectSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold text-gray-950">{title}</h2>
      {children}
    </section>
  );
}
