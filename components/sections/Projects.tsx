'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, GanttChart, AlignLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Project, ProjectPortfolioSync, ProjectPortfolioSyncEntry } from '@/lib/types';
import SectionWrapper from '../ui/SectionWrapper';
import ProjectCard from '../ui/ProjectCard';
import ProjectTimelineView from '../ui/ProjectTimelineView';
import ProjectVerticalTimelineView from '../ui/ProjectVerticalTimelineView';

const ProjectModal = dynamic(() => import('../ui/ProjectModal'), { ssr: false });

type FilterType = 'all' | 'main';
type ViewType = 'card' | 'timeline' | 'vertical';

const SCROLL_AMOUNT = 504; // card 480px + gap 24px

interface ProjectsProps {
  projectsData: Project[];
  projectPortfolioSyncData: ProjectPortfolioSync;
}

function normalizeProjectKey(value: string) {
  return value.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

export default function Projects({
  projectsData,
  projectPortfolioSyncData,
}: ProjectsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<ViewType>('card');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const projectPortfolioSync = projectPortfolioSyncData;
  const syncLookup = useMemo(() => {
    return projectPortfolioSync.projects.reduce<Record<string, ProjectPortfolioSyncEntry>>(
      (acc, entry) => {
        const lookupKeys = [
          entry.projectKey,
          normalizeProjectKey(entry.projectTitle),
          normalizeProjectKey(entry.headline),
        ].filter(Boolean);
        for (const lookupKey of lookupKeys) {
          acc[lookupKey] = entry;
        }
        return acc;
      },
      {},
    );
  }, [projectPortfolioSync.projects]);
  const mergedProjects = useMemo<Project[]>(() => {
    return projectsData.map((project) => {
      const portfolioSync = syncLookup[normalizeProjectKey(project.title)];
      return {
        ...project,
        period: portfolioSync?.period || project.period,
        shortDescription: portfolioSync?.summary || project.shortDescription,
        thumbnail: portfolioSync?.thumbnail || project.thumbnail,
        screenshots:
          portfolioSync?.screenshots.length
            ? portfolioSync.screenshots
            : project.screenshots,
        portfolioSync,
      };
    });
  }, [projectsData, syncLookup]);

  const filteredProjects =
    filter === 'all'
      ? mergedProjects
      : mergedProjects.filter((project) => project.isMain);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    const cardEl = el.querySelector(':scope > div');
    const cardWidth = cardEl?.clientWidth ?? 327;
    const gap = 24;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(index, filteredProjects.length - 1));
  }, [filteredProjects.length]);

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

  // Reset scroll position when filter changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(updateScrollButtons);
  }, [filter, updateScrollButtons]);

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
      className="bg-neutral-50"
      contentVisibility
      fullWidthContent
    >
      {/* Filter buttons + view toggle — constrained to max-w-6xl */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-6 py-2 font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('main')}
              className={`rounded-full px-6 py-2 font-medium transition-colors ${
                filter === 'main'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              주요 프로젝트
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setView('card')}
              aria-label="카드 뷰"
              className={`p-2 rounded-full transition-colors ${
                view === 'card'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('timeline')}
              aria-label="간트 타임라인 뷰"
              className={`p-2 rounded-full transition-colors ${
                view === 'timeline'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <GanttChart size={16} />
            </button>
            <button
              onClick={() => setView('vertical')}
              aria-label="세로 타임라인 뷰"
              className={`p-2 rounded-full transition-colors ${
                view === 'vertical'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <AlignLeft size={16} />
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
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory carousel-scrollbar-hide px-4 md:px-[max(1rem,calc((100vw-72rem)/2+1rem))] pb-4"
          >
            {filteredProjects.map((project) => (
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
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

          {/* 모바일 페이지네이션 도트 */}
          <div className="flex md:hidden justify-center gap-2 mt-4">
            {filteredProjects.map((_, i) => (
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
                  i === activeIndex ? 'bg-gray-800 w-6' : 'bg-gray-300 w-2'
                }`}
                aria-label={`프로젝트 ${i + 1}`}
              />
            ))}
          </div>
        </div>
      ) : view === 'timeline' ? (
        <div className="max-w-6xl mx-auto px-4">
          <ProjectTimelineView
            projects={filteredProjects}
            onDetailClick={handleDetailClick}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <ProjectVerticalTimelineView
            projects={filteredProjects}
            onDetailClick={handleDetailClick}
          />
        </div>
      )}

      <ProjectModal project={selectedProject} onClose={handleCloseModal} />
    </SectionWrapper>
  );
}
