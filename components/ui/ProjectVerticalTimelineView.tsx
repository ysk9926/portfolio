'use client';

import { useMemo } from 'react';
import { Project } from '@/lib/types';
import { parsePeriod, sortProjectsByStartDate } from '@/lib/timeline';
import AnimateOnScroll from './AnimateOnScroll';

interface ProjectVerticalTimelineViewProps {
  projects: Project[];
  onDetailClick: (project: Project) => void;
}

export default function ProjectVerticalTimelineView({
  projects,
  onDetailClick,
}: ProjectVerticalTimelineViewProps) {
  const sorted = useMemo(
    () => [...sortProjectsByStartDate(projects)].reverse(),
    [projects],
  );

  const yearGroups = useMemo(() => {
    const groups: { year: number; projects: Project[] }[] = [];
    for (const project of sorted) {
      const parsed = parsePeriod(project.period);
      const year = parsed.startYear;
      const last = groups[groups.length - 1];
      if (last && last.year === year) {
        last.projects.push(project);
      } else {
        groups.push({ year, projects: [project] });
      }
    }
    return groups;
  }, [sorted]);

  if (sorted.length === 0) return null;

  let globalIndex = -1;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute top-0 bottom-0 w-0.5 bg-neutral-300 left-4 md:left-1/2 md:-translate-x-1/2"
      />

      <div className="space-y-10 md:space-y-16">
        {yearGroups.map((group) => (
          <div key={group.year} className="relative">
            <div className="relative flex md:justify-center mb-6 md:mb-10">
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                <div className="rounded-full bg-neutral-900 text-white text-xs md:text-sm font-semibold px-4 py-1.5 shadow-md whitespace-nowrap">
                  {group.year}
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-10">
              {group.projects.map((project) => {
                globalIndex++;
                const parsed = parsePeriod(project.period);
                const isLeft = globalIndex % 2 === 0;

                return (
                  <AnimateOnScroll key={project.id}>
                    <div className="relative md:grid md:grid-cols-2 md:gap-12 items-center">
                      <div
                        aria-hidden
                        className="absolute z-10 left-4 md:left-1/2 -translate-x-1/2 top-5 md:top-1/2 md:-translate-y-1/2"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-[3px] border-white shadow ${
                            parsed.isOngoing
                              ? 'bg-green-500 animate-pulse-dot'
                              : project.isMain
                                ? 'bg-neutral-900'
                                : 'bg-neutral-400'
                          }`}
                        />
                      </div>

                      <div
                        className={`pl-12 md:pl-0 ${
                          isLeft
                            ? 'md:col-start-1 md:pr-8 md:text-right'
                            : 'md:col-start-2 md:pl-8'
                        }`}
                      >
                        <button
                          onClick={() => onDetailClick(project)}
                          className="w-full text-left p-4 md:p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div
                            className={`flex flex-wrap items-center gap-2 mb-2 ${
                              isLeft ? 'md:justify-end' : ''
                            }`}
                          >
                            {project.portfolioSync?.status && (
                              <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                                {project.portfolioSync.status}
                              </span>
                            )}
                            <span className="text-[11px] md:text-xs text-neutral-500">
                              {project.period}
                            </span>
                            {parsed.isOngoing && (
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                            )}
                          </div>

                          <h4 className="font-semibold text-sm md:text-base text-neutral-900 mb-1.5">
                            {project.title}
                          </h4>

                          {(project.portfolioSync?.summary ||
                            project.shortDescription) && (
                            <p
                              className={`text-xs md:text-sm text-neutral-600 mb-3 line-clamp-2 ${
                                isLeft ? 'md:text-right' : ''
                              }`}
                            >
                              {project.portfolioSync?.summary ||
                                project.shortDescription}
                            </p>
                          )}

                          <div
                            className={`flex flex-wrap gap-1 ${
                              isLeft ? 'md:justify-end' : ''
                            }`}
                          >
                            {project.techStack.slice(0, 4).map((tech) => (
                              <span
                                key={tech}
                                className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                              >
                                {tech}
                              </span>
                            ))}
                            {project.techStack.length > 4 && (
                              <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-400">
                                +{project.techStack.length - 4}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>

                      <div
                        aria-hidden
                        className={`hidden md:block ${
                          isLeft ? 'md:col-start-2' : 'md:col-start-1'
                        }`}
                      />
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
