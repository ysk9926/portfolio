'use client';

import { useMemo } from 'react';
import { Project } from '@/lib/types';
import { parsePeriod, sortProjectsByStartDate } from '@/lib/timeline';
import { useScrollSpotlight } from '@/lib/hooks/useScrollSpotlight';
import AnimateOnScroll from './AnimateOnScroll';
import TimelineProjectChip from './TimelineProjectChip';

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

  const keys = useMemo(() => sorted.map((p) => String(p.id)), [sorted]);
  const { activeKey, register } = useScrollSpotlight(keys);

  if (sorted.length === 0) return null;

  let globalIndex = -1;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute top-0 bottom-0 w-px bg-ai-ink/15 left-4 md:left-1/2 md:-translate-x-1/2"
      />

      <div className="space-y-10 md:space-y-16">
        {yearGroups.map((group) => (
          <div key={group.year} className="relative">
            <div className="relative flex md:justify-center mb-6 md:mb-10">
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                <div className="rounded-full border border-white/10 bg-ai-ink px-4 py-1.5 font-mono text-xs font-semibold text-white shadow-md whitespace-nowrap md:text-sm">
                  {group.year}
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-10">
              {group.projects.map((project) => {
                globalIndex++;
                const parsed = parsePeriod(project.period);
                const isLeft = globalIndex % 2 === 0;
                const isActive = activeKey === String(project.id);

                return (
                  <AnimateOnScroll key={project.id}>
                    <div className="relative md:grid md:grid-cols-2 md:gap-12 items-center">
                      {/* Timeline dot: grows and gains a halo while spotlighted */}
                      <div
                        aria-hidden
                        className="absolute z-10 left-4 md:left-1/2 -translate-x-1/2 top-5 md:top-1/2 md:-translate-y-1/2"
                      >
                        <div
                          className={`rounded-full border-[3px] border-[#f6f3ee] shadow transition-all duration-300 ease-out ${
                            isActive
                              ? 'w-5 h-5 ring-4 ring-ai-accent/25'
                              : 'w-4 h-4'
                          } ${
                            parsed.isOngoing
                              ? 'bg-ai-codex animate-pulse-dot'
                              : isActive
                                ? 'bg-ai-accent'
                                : project.isMain
                                  ? 'bg-ai-ink'
                                  : 'bg-ai-ink/30'
                          }`}
                        />
                      </div>

                      {/* Connector from the spine to the chip: lights up while spotlighted */}
                      <div
                        aria-hidden
                        className={`absolute h-px top-[27px] left-4 w-8 origin-left transition-all duration-500 ease-out md:top-1/2 md:w-8 ${
                          isLeft
                            ? 'md:left-auto md:right-1/2 md:origin-right'
                            : 'md:left-1/2'
                        } ${isActive ? 'bg-ai-accent scale-x-100' : 'bg-ai-ink/20 scale-x-0'}`}
                      />

                      <div
                        className={`pl-12 md:pl-0 ${
                          isLeft
                            ? 'md:col-start-1 md:pr-8'
                            : 'md:col-start-2 md:pl-8'
                        }`}
                      >
                        <TimelineProjectChip
                          ref={register(String(project.id))}
                          project={project}
                          onOpen={onDetailClick}
                          isActive={isActive}
                          alignEnd={isLeft}
                        />
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
