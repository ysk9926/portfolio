'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  Github,
  Images,
  Layers,
  Lightbulb,
  ListChecks,
  Route,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';
import { Project } from '@/lib/types';
import { projectPath } from '@/lib/projects/portfolio';
import TechChip from './TechChip';
import {
  SplitModal,
  SplitModalSection,
  type SplitModalFact,
  type SplitModalFactGroup,
  type SplitModalStat,
  type SplitModalTab,
} from '../pds/split-modal';
import ImageSlider from './ImageSlider';
import MarkdownRenderer from './MarkdownRenderer';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

type TabKey = 'overview' | 'star' | 'features' | 'troubleshooting';

/** Sync data may carry placeholders such as "[확인 필요]" or "-"; treat those as absent. */
function present(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '-' || /^\[.*\]$/.test(trimmed)) return undefined;
  return trimmed;
}

function buildTabs(project: Project): SplitModalTab<TabKey>[] {
  const tabs: SplitModalTab<TabKey>[] = [
    { key: 'overview', label: '개요', icon: <Images /> },
    { key: 'star', label: project.star ? '배경·STAR' : '설명', icon: <Sparkles /> },
    { key: 'features', label: '주요 기능', icon: <ListChecks /> },
  ];
  if (project.star?.troubleshooting) {
    tabs.push({ key: 'troubleshooting', label: '트러블슈팅', icon: <Wrench /> });
  }
  return tabs;
}

function buildFactGroups(project: Project): SplitModalFactGroup[] {
  const sync = project.portfolioSync;
  const basic: SplitModalFact[] = [
    { icon: <CalendarDays />, label: '기간', value: project.period },
  ];
  const status = present(sync?.status);
  const track = present(sync?.track);
  if (status) basic.push({ icon: <Route />, label: '상태', value: status, tone: 'accent' });
  if (track) basic.push({ icon: <Layers />, label: '트랙', value: track });

  const people: SplitModalFact[] = [];
  const company = present(sync?.company);
  const role = present(sync?.role) || present(project.star?.role);
  const teamSize = present(sync?.teamSize);
  if (company) people.push({ icon: <Building2 />, label: '회사', value: company });
  if (role) people.push({ icon: <UserRound />, label: '역할', value: role });
  if (teamSize) people.push({ icon: <Users />, label: '팀 규모', value: teamSize });

  const groups: SplitModalFactGroup[] = [{ label: '기본 정보', facts: basic }];
  if (people.length) groups.push({ label: '참여', facts: people });
  return groups;
}

function StatIcon({ children }: { children: ReactNode }) {
  return <span className="pds-stat-icon">{children}</span>;
}

function buildStats(project: Project): SplitModalStat[] {
  const stats: SplitModalStat[] = [
    {
      icon: <StatIcon><Briefcase /></StatIcon>,
      label: '역할',
      value: present(project.star?.role) || present(project.portfolioSync?.role) || '개발',
      note: present(project.portfolioSync?.company),
    },
    {
      icon: <StatIcon><ListChecks /></StatIcon>,
      label: '주요 기능',
      value: `${project.features.length}개`,
      note: project.features[0],
    },
    {
      icon: <StatIcon><Layers /></StatIcon>,
      label: '기술 스택',
      value: `${project.techStack.length}개`,
      note: project.techStack.slice(0, 3).join(' · '),
    },
  ];
  return stats;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  if (!project) return null;
  // Keyed by project so the tab state resets whenever a different project opens.
  return <ProjectSplitModal key={project.id} project={project} onClose={onClose} />;
}

function ProjectSplitModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>('overview');
  const tabs = useMemo(() => buildTabs(project), [project]);
  const factGroups = useMemo(() => buildFactGroups(project), [project]);
  const stats = useMemo(() => buildStats(project), [project]);

  const summary =
    project.star?.summary || project.portfolioSync?.summary || project.shortDescription;
  // Accent follows the site's heatmap legend: amber for company work, emerald for personal projects.
  const tone = present(project.portfolioSync?.company) ? 'company' : 'personal';
  const eyebrow =
    present(project.portfolioSync?.status) ?? '프로젝트';
  // Thumbnail leads the gallery; skip it when it duplicates a screenshot.
  const images = useMemo(() => {
    const list = [project.thumbnail, ...(project.screenshots ?? [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [project.thumbnail, project.screenshots]);

  return (
    <SplitModal<TabKey>
      open
      onClose={onClose}
      ariaLabel={project.title}
      closeLabel="닫기"
      rootClassName={`pds-tone-${tone}`}
      railWidth={260}
      dialogProps={{
        'data-analytics-project': project.id,
        'data-analytics-surface': 'modal',
      }}
      profile={{
        eyebrow: (
          <span className="pds-eyebrow-pill">
            <span aria-hidden className="pds-eyebrow-pill__dot" />
            {eyebrow}
          </span>
        ),
        title: project.title,
      }}
      factGroups={factGroups}
      rail={
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.07em] text-neutral-500">
            기술 스택
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <TechChip key={tech} name={tech} />
            ))}
          </div>
        </div>
      }
      railFooter={
        <div className="pds-split-modal__actions">
          <Link href={projectPath(project)} className="is-primary is-wide">
            <ArrowUpRight />
            상세 페이지
          </Link>
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              data-analytics-target="demo"
              data-analytics-project-id={project.id}
              target="_blank"
              rel="noopener noreferrer"
              className={project.githubUrl ? undefined : 'is-wide'}
            >
              <ExternalLink />
              배포 사이트
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              data-analytics-target="github"
              data-analytics-project-id={project.id}
              target="_blank"
              rel="noopener noreferrer"
              className={project.deployUrl ? undefined : 'is-wide'}
            >
              <Github />
              GitHub
            </a>
          )}
        </div>
      }
      tabs={tabs}
      tab={tab}
      onTabChange={setTab}
      tabsAriaLabel={`${project.title} 상세`}
      stats={stats}
    >
      {tab === 'overview' && (
        <>
          {images.length > 0 && (
            <SplitModalSection
              icon={<Images />}
              title="스크린샷"
              note={`${images.length}장`}
            >
              <div className="px-4 py-4 md:px-5">
                <ImageSlider screenshots={images} alt={project.title} />
              </div>
            </SplitModalSection>
          )}

          {summary && (
            <SplitModalSection icon={<AlertCircle />} title="요약">
              <p className="px-4 py-4 text-sm leading-relaxed text-neutral-700 md:px-5">
                {summary}
              </p>
            </SplitModalSection>
          )}
        </>
      )}

      {tab === 'star' &&
        (project.star ? (
          <>
            <SplitModalSection icon={<AlertCircle />} title="프로젝트 배경">
              <div className="px-4 py-4 md:px-5">
                <MarkdownRenderer content={project.star.background} />
              </div>
            </SplitModalSection>
            <SplitModalSection icon={<Lightbulb />} title="핵심 구현">
              <div className="px-4 py-4 md:px-5">
                <MarkdownRenderer content={project.star.solutions} />
              </div>
            </SplitModalSection>
            <SplitModalSection icon={<TrendingUp />} title="성과">
              <div className="px-4 py-4 md:px-5">
                <MarkdownRenderer content={project.star.results} />
              </div>
            </SplitModalSection>
          </>
        ) : (
          <SplitModalSection icon={<Lightbulb />} title="설명">
            <p className="px-4 py-4 text-sm leading-relaxed text-neutral-700 md:px-5">
              {project.description}
            </p>
          </SplitModalSection>
        ))}

      {tab === 'features' && (
        <>
          <SplitModalSection
            icon={<ListChecks />}
            title="주요 기능"
            note={`${project.features.length}개`}
          >
            <ul className="divide-y divide-neutral-100">
              {project.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 text-sm text-neutral-700 md:px-5"
                >
                  <span className="pds-feature-index">{i + 1}</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </SplitModalSection>
        </>
      )}

      {tab === 'troubleshooting' && project.star?.troubleshooting && (
        <SplitModalSection icon={<Wrench />} title="트러블슈팅">
          <div className="px-4 py-4 md:px-5">
            <MarkdownRenderer content={project.star.troubleshooting} />
          </div>
        </SplitModalSection>
      )}
    </SplitModal>
  );
}
