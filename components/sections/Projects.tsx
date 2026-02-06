'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { projectsData } from '../../data/projects';
import { Project } from '@/lib/types';
import SectionWrapper from '../ui/SectionWrapper';
import ProjectCard from '../ui/ProjectCard';

const ProjectModal = dynamic(() => import('../ui/ProjectModal'), { ssr: false });

type FilterType = 'all' | 'main';

const SCROLL_AMOUNT = 504; // card 480px + gap 24px

export default function Projects() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredProjects =
    filter === 'all'
      ? projectsData
      : projectsData.filter((project) => project.isMain);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

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
      className="bg-gray-50"
      contentVisibility
      fullWidthContent
    >
      {/* Filter buttons — constrained to max-w-6xl */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center gap-3 mb-8">
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
      </div>

      {/* Carousel area */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
          aria-label="이전 프로젝트"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory carousel-scrollbar-hide px-4 md:px-[max(1rem,calc((100vw-72rem)/2+1rem))] pb-4"
        >
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="shrink-0 w-[280px] md:w-[480px] snap-center"
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>

      <ProjectModal project={selectedProject} onClose={handleCloseModal} />
    </SectionWrapper>
  );
}
