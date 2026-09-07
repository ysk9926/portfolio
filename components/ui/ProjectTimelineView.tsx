'use client';

import { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Project } from '@/lib/types';
import {
  parsePeriod,
  generateTimelineMonths,
  getProjectSpan,
  sortProjectsByStartDate,
} from '@/lib/timeline';
import { useScrollSpotlight } from '@/lib/hooks/useScrollSpotlight';
import AnimateOnScroll from './AnimateOnScroll';
import TimelineProjectChip from './TimelineProjectChip';

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

  const keys = useMemo(() => sorted.map((p) => String(p.id)), [sorted]);
  const { activeKey, register } = useScrollSpotlight(keys);

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
                        <div
                          className={`absolute z-10 top-2 bottom-2 left-0.5 flex items-center overflow-hidden rounded-md text-xs font-medium transition-all hover:scale-[1.02] hover:shadow-md ${
                            project.isMain
                              ? 'bg-neutral-800 text-white'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                          style={{
                            width: `calc(${spanCount} * 100% + ${spanCount - 1} * 0px - 4px)`,
                          }}
                          title={`${project.title} (${project.period})`}
                        >
                          <button
                            type="button"
                            onClick={() => onDetailClick(project)}
                            aria-label={`${project.title} 프로젝트 열기`}
                            className={`group/bar flex min-w-0 flex-1 items-center gap-1.5 self-stretch px-3 text-left transition-colors ${
                              project.isMain
                                ? 'hover:bg-neutral-700'
                                : 'hover:bg-neutral-300'
                            }`}
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
                            <ArrowUpRight
                              size={12}
                              strokeWidth={2.5}
                              className="ml-auto shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover/bar:translate-x-0 group-hover/bar:opacity-100"
                            />
                          </button>
                        </div>
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
                    className={`absolute top-1 rounded-full border-2 border-white transition-all duration-300 ${
                      activeKey === String(project.id)
                        ? '-left-[11px] w-5 h-5 ring-4 ring-neutral-900/15'
                        : '-left-[9px] w-4 h-4'
                    } ${
                      parsed.isOngoing
                        ? 'bg-green-500 animate-pulse-dot'
                        : project.isMain || activeKey === String(project.id)
                          ? 'bg-neutral-800'
                          : 'bg-neutral-300'
                    }`}
                  />

                  {/* Chip */}
                  <TimelineProjectChip
                    ref={register(String(project.id))}
                    project={project}
                    onOpen={onDetailClick}
                    isActive={activeKey === String(project.id)}
                    compact
                  />
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </>
  );
}
