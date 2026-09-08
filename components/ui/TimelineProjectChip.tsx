'use client';

import { forwardRef, type KeyboardEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Project } from '@/lib/types';
import { parsePeriod } from '@/lib/timeline';

interface TimelineProjectChipProps {
  project: Project;
  onOpen: (project: Project) => void;
  /** Spotlighted by scroll position (closest to viewport center). */
  isActive?: boolean;
  /** Right-align content on desktop for the left column of the timeline. */
  alignEnd?: boolean;
  /** Hide the summary line and show fewer tech tags. */
  compact?: boolean;
}

const TimelineProjectChip = forwardRef<HTMLElement, TimelineProjectChipProps>(
  function TimelineProjectChip(
    { project, onOpen, isActive = false, alignEnd = false, compact = false },
    ref,
  ) {
    const parsed = parsePeriod(project.period);
    const summary = project.portfolioSync?.summary || project.shortDescription;
    const tagLimit = compact ? 3 : 4;
    const alignClass = alignEnd ? 'md:justify-end' : '';

    const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(project);
      }
    };

    return (
      <article
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`${project.title} 프로젝트 열기`}
        data-active={isActive ? 'true' : undefined}
        onClick={() => onOpen(project)}
        onKeyDown={handleKeyDown}
        className={`project-chip group/chip relative w-full cursor-pointer overflow-hidden rounded-xl border bg-white/80 text-left outline-none backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-ai-accent focus-visible:ring-offset-2 ${
          compact ? 'p-4' : 'p-4 md:p-5'
        } ${
          isActive
            ? 'border-ai-ink shadow-lg -translate-y-0.5'
            : 'border-ai-ink/10 hover:-translate-y-0.5 hover:border-ai-ink/40 hover:shadow-md'
        }`}
      >
        {/* Corner affordance: slides in on hover, stays lit while active */}
        <span
          aria-hidden
          className={`pointer-events-none absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-out ${
            isActive
              ? 'bg-ai-accent text-white opacity-100'
              : 'translate-x-1 bg-ai-accent-soft text-[#8a3f22] opacity-0 group-hover/chip:translate-x-0 group-hover/chip:opacity-100'
          }`}
        >
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </span>

        <div className={`mb-2 flex flex-wrap items-center gap-2 pr-8 ${alignClass}`}>
          {project.portfolioSync?.status && (
            <span className="rounded-full border border-ai-ink/10 bg-ai-ink/5 px-2 py-0.5 font-mono text-[10px] text-neutral-600">
              {project.portfolioSync.status}
            </span>
          )}
          <span className="font-mono text-[11px] text-ai-accent">
            {project.period}
          </span>
          {parsed.isOngoing && (
            <span className="inline-block h-2 w-2 rounded-full bg-ai-codex animate-pulse-dot" />
          )}
        </div>

        <h3
          className={`mb-1.5 font-semibold text-ai-ink ${
            compact ? 'text-sm' : 'text-sm md:text-base'
          }`}
        >
          {project.title}
        </h3>

        {!compact && summary && (
          <p
            className={`mb-3 line-clamp-2 text-xs text-neutral-600 md:text-sm ${
              alignEnd ? 'md:text-right' : ''
            }`}
          >
            {summary}
          </p>
        )}

        <div className={`flex flex-wrap gap-1 ${alignClass}`}>
          {project.techStack.slice(0, tagLimit).map((tech) => (
            <span
              key={tech}
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors duration-300 ${
                isActive
                  ? 'bg-ai-ink text-white'
                  : 'bg-ai-ink/5 text-neutral-600 group-hover/chip:bg-ai-ink/10'
              }`}
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > tagLimit && (
            <span className="rounded-full px-2 py-0.5 font-mono text-[10px] text-neutral-400">
              +{project.techStack.length - tagLimit}
            </span>
          )}
        </div>

        {/* Bottom rule: draws in on hover, held while active */}
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 bg-ai-accent transition-transform duration-500 ease-out ${
            alignEnd ? 'origin-right' : 'origin-left'
          } ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover/chip:scale-x-100'}`}
        />
      </article>
    );
  },
);

export default TimelineProjectChip;
