import { ArrowUpRight } from 'lucide-react';
import { ArchiveItem } from '@/lib/types';

export default function ArchiveCard({
  title,
  description,
  url,
  details,
}: ArchiveItem) {
  const isExternal = /^https?:\/\//.test(url);
  const path = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <a
      href={url}
      data-analytics-target="archive"
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="ai-console group flex h-full flex-col gap-5 rounded-2xl p-7 text-neutral-100 transition-colors duration-300 hover:border-ai-accent/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai-accent md:p-9"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-neutral-500">
            ~/<span className="text-neutral-300">{path}</span>
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h3>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-neutral-400 transition-colors group-hover:border-ai-accent group-hover:text-ai-accent">
          <ArrowUpRight aria-hidden size={16} strokeWidth={2.5} />
        </span>
      </div>
      <p className="text-base text-neutral-400">{description}</p>
      <ul className="space-y-2.5 border-t border-white/10 pt-5">
        {details.map((detail) => (
          <li key={detail} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-200">
            <span aria-hidden className="mt-0.5 font-mono text-ai-accent">›</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-2 font-mono text-[11px] text-neutral-500 transition-colors group-hover:text-ai-accent">
        $ open {isExternal ? url.replace(/^https?:\/\//, '') : url}
      </p>
    </a>
  );
}
