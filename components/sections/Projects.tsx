'use client';

import { useState } from 'react';
import { projectsData } from '../../data/projects';
import SectionWrapper from '../ui/SectionWrapper';
import ProjectCard from '../ui/ProjectCard';
import AnimateOnScroll from '../ui/AnimateOnScroll';

type FilterType = 'all' | 'main';

export default function Projects() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredProjects =
    filter === 'all'
      ? projectsData
      : projectsData.filter((project) => project.isMain);

  return (
    <SectionWrapper
      id="projects"
      title="Projects"
      className="bg-gray-50"
      contentVisibility
    >
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {filteredProjects.map((project) => (
          <AnimateOnScroll key={project.id}>
            <ProjectCard {...project} />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
