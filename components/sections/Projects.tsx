'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, GanttChart, AlignLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Project, ProjectPortfolioSync } from '@/lib/types';
import { mergePortfolioProjects } from '@/lib/projects/portfolio';
import { selectFeaturedProjects } from '@/lib/projects/featured';
import SectionWrapper from '../ui/SectionWrapper';
import ProjectCard from '../ui/ProjectCard';

const ProjectModal = dynamic(() => import('../ui/ProjectModal'), { ssr: false });
const ProjectTimelineView = dynamic(() => import('../ui/ProjectTimelineView'));
const ProjectVerticalTimelineView = dynamic(
  () => import('../ui/ProjectVerticalTimelineView'),
);

type ViewType = 'card' | 'timeline' | 'vertical';

const SCROLL_AMOUNT = 504; // card 480px + gap 24px

interface ProjectsProps {
  projectsData: Project[];
  projectPortfolioSyncData: ProjectPortfolioSync;
  featuredIds: number[];
}

export default function Projects({
  projectsData,
  projectPortfolioSyncData,
  featuredIds,
}: ProjectsProps) {
  const [view, setView] = useState<ViewType>('vertical');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mergedProjects = useMemo<Project[]>(() => {
    return mergePortfolioProjects(projectsData, projectPortfolioSyncData);
  }, [projectsData, projectPortfolioSyncData]);
  const featuredProjects = useMemo(
    () => selectFeaturedProjects(mergedProjects, featuredIds),
    [mergedProjects, featuredIds],
  );


  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    const cardEl = el.querySelector(':scope > div');
    const cardWidth = cardEl?.clientWidth ?? 327;
    const gap = 24;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(index, mergedProjects.length - 1));
  }, [mergedProjects.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    updateScrollButtons();
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const handleScrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  }, []);

  const handleScrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  }, []);

  const handleDetailClick = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <SectionWrapper
      id="projects"
      title="Projects"
      className="ai-paper text-ai-ink"
      fullWidthContent
    >
      {featuredProjects.length > 0 && (
        <div className="mx-auto mb-16 max-w-6xl px-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-ai-ink/10 pb-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ai-accent">selected work / 01—0{featuredProjects.length}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">대표 프로젝트</h3>
            </div>
            <p className="max-w-md text-sm text-neutral-600">기업용 시스템과 AI 프로젝트에서 맡은 문제와 해결 과정을 확인할 수 있습니다.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredProjects.map((project, index) => (
              <div key={project.id}>
                <p className="mb-2 font-mono text-xs text-neutral-500">0{index + 1} / {project.title}</p>
                <ProjectCard project={project} onDetailClick={handleDetailClick} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto mb-4 max-w-6xl px-4">
        <h3 className="text-xl font-bold tracking-tight md:text-2xl">전체 프로젝트</h3>
      </div>
      {/* View toggle — constrained to max-w-6xl */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-end gap-3">
          <div className="paper-card inline-flex rounded-full p-1">
            <button
              onClick={() => setView('vertical')}
              aria-label="세로 타임라인 뷰"
              className={`cursor-pointer rounded-full p-2 transition-colors ${
                view === 'vertical'
                  ? 'bg-ai-ink text-white'
                  : 'text-neutral-500 hover:text-ai-ink'
              }`}
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => setView('timeline')}
              aria-label="간트 타임라인 뷰"
              className={`cursor-pointer rounded-full p-2 transition-colors ${
                view === 'timeline'
                  ? 'bg-ai-ink text-white'
                  : 'text-neutral-500 hover:text-ai-ink'
              }`}
            >
              <GanttChart size={16} />
            </button>
            <button
              onClick={() => setView('card')}
              aria-label="카드 뷰"
              className={`cursor-pointer rounded-full p-2 transition-colors ${
                view === 'card'
                  ? 'bg-ai-ink text-white'
                  : 'text-neutral-500 hover:text-ai-ink'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {view === 'card' ? (
        /* Carousel area */
        <div className="relative group">
          {/* Left arrow */}
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="이전 프로젝트"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full border border-ai-ink/10 bg-white/90 text-ai-ink shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:border-ai-accent hover:text-ai-accent disabled:opacity-0 cursor-pointer"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory carousel-scrollbar-hide px-4 md:px-[max(1rem,calc((100vw-72rem)/2+1rem))] pb-4"
          >
            {mergedProjects.map((project) => (
              <div
                key={project.id}
                className="shrink-0 w-[calc(100vw-3rem)] md:w-[480px] snap-center"
              >
                <ProjectCard project={project} onDetailClick={handleDetailClick} />
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="다음 프로젝트"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full border border-ai-ink/10 bg-white/90 text-ai-ink shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:border-ai-accent hover:text-ai-accent disabled:opacity-0 cursor-pointer"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

          {/* 모바일 페이지네이션 도트 */}
          <div className="flex md:hidden justify-center gap-2 mt-4">
            {mergedProjects.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  const cardEl = el.querySelector(':scope > div');
                  const cardWidth = cardEl?.clientWidth ?? 327;
                  el.scrollTo({ left: i * (cardWidth + 24), behavior: 'smooth' });
                }}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? 'w-6 bg-ai-accent' : 'w-2 bg-ai-ink/20'
                }`}
                aria-label={`프로젝트 ${i + 1}`}
              />
            ))}
          </div>
        </div>
      ) : view === 'timeline' ? (
        <div className="max-w-6xl mx-auto px-4">
          <ProjectTimelineView
            projects={mergedProjects}
            onDetailClick={handleDetailClick}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <ProjectVerticalTimelineView
            projects={mergedProjects}
            onDetailClick={handleDetailClick}
          />
        </div>
      )}

      <ProjectModal project={selectedProject} onClose={handleCloseModal} />
    </SectionWrapper>
  );
}
