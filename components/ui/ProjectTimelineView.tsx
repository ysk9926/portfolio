'use client';

import { useMemo } from 'react';
import { Project } from '@/lib/types';
import {
  parsePeriod,
  generateTimelineMonths,
  getProjectSpan,
  sortProjectsByStartDate,
} from '@/lib/timeline';
import AnimateOnScroll from './AnimateOnScroll';

interface ProjectTimelineViewProps {
  projects: Project[];
  onDetailClick: (project: Project) => void;
}

export default function ProjectTimelineView({
  projects,
  onDetailClick,
}: ProjectTimelineViewProps) {
  const sorted = useMemo(() => sortProjectsByStartDate(projects), [projects]);
  const months = useMemo(() => generateTimelineMonths(sorted), [sorted]);

  // Group months by year for header labels
  const yearBreaks = useMemo(() => {
    const breaks: { year: number; startIndex: number; count: number }[] = [];
    let currentYear = -1;
    for (let i = 0; i < months.length; i++) {
      if (months[i].year !== currentYear) {
        currentYear = months[i].year;
        breaks.push({ year: currentYear, startIndex: i, count: 1 });
      } else {
        breaks[breaks.length - 1].count++;
      }
    }
    return breaks;
  }, [months]);

  if (sorted.length === 0) return null;

  return (
    <>
      {/* Desktop: Horizontal bar chart */}
      <AnimateOnScroll className="hidden md:block">
        <div
          className="grid gap-y-0"
          style={{
            gridTemplateColumns: `80px repeat(${months.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Year labels row */}
          <div className="h-6" /> {/* empty cell for label column */}
          {yearBreaks.map((yb) => (
            <div
              key={yb.year}
              className="text-xs font-semibold text-neutral-500 flex items-end pb-1 pl-1"
              style={{ gridColumn: `${yb.startIndex + 2} / span ${yb.count}` }}
            >
              {yb.year}
            </div>
          ))}

          {/* Month headers row */}
          <div className="h-8" /> {/* empty cell for label column */}
          {months.map((m, i) => (
            <div
              key={`${m.year}-${m.month}`}
              className={`text-xs text-neutral-400 flex items-center justify-center h-8 border-l ${
                i === 0 ? 'border-l-0' : ''
              } border-neutral-200`}
            >
              {m.label}
            </div>
          ))}

          {/* Grid lines background + project rows */}
          {sorted.map((project, rowIndex) => {
            const { startIndex, spanCount } = getProjectSpan(
              project.period,
              months,
            );
            const parsed = parsePeriod(project.period);

            return (
              <div key={project.id} className="contents">
                {/* Project name label */}
                <div
                  className="flex items-center pr-3 h-12 text-xs font-medium text-neutral-500 truncate"
                  title={project.title}
                />

                {/* Grid cells background */}
                {months.map((m, i) => {
                  const isInSpan =
                    i >= startIndex && i < startIndex + spanCount;

                  return (
                    <div
                      key={`${project.id}-${m.year}-${m.month}`}
                      className={`h-12 border-l ${
                        i === 0 ? 'border-l-0' : ''
                      } border-neutral-100 ${
                        rowIndex < sorted.length - 1
                          ? 'border-b border-b-neutral-100'
                          : ''
                      } relative`}
                    >
                      {/* Render bar segment */}
                      {isInSpan && i === startIndex && (
                        <button
                          onClick={() => onDetailClick(project)}
                          className={`absolute top-2 bottom-2 left-0.5 flex items-center gap-1.5 px-3 rounded-md text-xs font-medium transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden ${
                            project.isMain
                              ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                          }`}
                          style={{
                            width: `calc(${spanCount} * 100% + ${spanCount - 1} * 0px - 4px)`,
                          }}
                          title={`${project.title} (${project.period})`}
                        >
                          <span className="truncate">{project.title}</span>
                          {parsed.isOngoing && (
                            <span
                              className={`shrink-0 w-2 h-2 rounded-full animate-pulse-dot ${
                                project.isMain
                                  ? 'bg-green-400'
                                  : 'bg-green-500'
                              }`}
                            />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AnimateOnScroll>

      {/* Mobile: Vertical timeline */}
      <div className="md:hidden pl-4">
        <div className="relative border-l-2 border-neutral-300 ml-2">
          {sorted.map((project) => {
            const parsed = parsePeriod(project.period);
            return (
              <AnimateOnScroll key={project.id}>
                <div className="relative pl-6 pb-6 last:pb-0">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                      parsed.isOngoing
                        ? 'bg-green-500 animate-pulse-dot'
                        : project.isMain
                          ? 'bg-neutral-800'
                          : 'bg-neutral-300'
                    }`}
                  />

                  {/* Card */}
                  <button
                    onClick={() => onDetailClick(project)}
                    className="w-full text-left p-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <h4 className="font-semibold text-sm text-neutral-900 mb-1">
                      {project.title}
                      {parsed.isOngoing && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                      )}
                    </h4>
                    <p className="text-xs text-neutral-500 mb-2">
                      {project.period}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </>
  );
}
