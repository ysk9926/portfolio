'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AiSkillGroup } from '@/lib/types/view';
import { CLIENT_BADGES } from './accent';

interface AiSkillRegistryProps {
  groups: AiSkillGroup[];
}

const PREVIEW_COUNT = 4;

const toPath = (title: string) =>
  title
    .replace(/\s*·\s*/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();

export default function AiSkillRegistry({ groups }: AiSkillRegistryProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => {
        const isOpen = expanded[group.title] ?? false;
        const hidden = Math.max(group.skills.length - PREVIEW_COUNT, 0);
        const visibleSkills = isOpen ? group.skills : group.skills.slice(0, PREVIEW_COUNT);

        return (
          <section
            key={group.title}
            className="paper-card flex flex-col rounded-2xl p-5 transition-colors hover:border-ai-ink/25"
          >
            <header>
              <p className="truncate font-mono text-[11px] text-neutral-500">
                ~/skills/<span className="text-ai-ink">{toPath(group.title)}</span>
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <h4 className="text-base font-bold text-ai-ink">{group.title}</h4>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-neutral-500">{group.skills.length}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${CLIENT_BADGES[group.client]}`}
                  >
                    {group.client}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">{group.description}</p>
            </header>

            <ul className="mt-4 flex-1 space-y-2 border-t border-ai-ink/10 pt-4">
              {visibleSkills.map((skill) => (
                <li key={skill.name} className="text-[13px] leading-snug">
                  <code className="font-mono text-[12px] font-medium text-ai-ink">/{skill.name}</code>
                  <span className="block text-neutral-600">{skill.summary}</span>
                </li>
              ))}
            </ul>

            {hidden > 0 && (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [group.title]: !isOpen }))
                }
                aria-expanded={isOpen}
                className="mt-4 inline-flex min-h-9 cursor-pointer items-center gap-1 self-start font-mono text-[11px] text-neutral-500 transition-colors hover:text-ai-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai-accent"
              >
                <ChevronDown
                  aria-hidden
                  size={14}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
                {isOpen ? '접기' : `+${hidden} more`}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
