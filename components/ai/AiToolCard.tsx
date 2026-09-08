import type { AiTool } from '@/lib/types/view';
import { TOOL_ACCENTS } from './accent';

interface AiToolCardProps {
  tool: AiTool;
  index: number;
}

export default function AiToolCard({ tool, index }: AiToolCardProps) {
  const accent = TOOL_ACCENTS[tool.accent];

  return (
    <article
      className={`ai-console group relative flex h-full flex-col rounded-2xl p-6 text-neutral-100 transition-colors duration-300 md:p-7 ${accent.ring}`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <header>
        <div className="flex items-center gap-2.5">
          <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent.dot}`} />
          <h3 className="text-lg font-bold tracking-tight text-white md:text-xl">{tool.name}</h3>
        </div>
        <span className="mt-2.5 inline-block rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
          {tool.kind}
        </span>
      </header>

      {tool.model && (
        <p className={`mt-3 font-mono text-xs ${accent.text}`}>
          <span className="text-neutral-500">model </span>
          {tool.model}
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-neutral-300">{tool.summary}</p>

      <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
        {tool.points.map((point) => (
          <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-neutral-200">
            <span aria-hidden className={`mt-0.5 shrink-0 font-mono ${accent.text}`}>
              ›
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
