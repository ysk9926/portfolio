import type { AiCommand } from '@/lib/types/view';
import { COMMAND_KINDS } from './accent';

interface AiCommandListProps {
  commands: AiCommand[];
}

export default function AiCommandList({ commands }: AiCommandListProps) {
  return (
    <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2">
      {commands.map((command) => {
        const kind = COMMAND_KINDS[command.kind];
        return (
          <li
            key={command.name}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 border-b border-ai-ink/10 py-3.5"
          >
            <span
              className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${kind.className}`}
            >
              {kind.label}
            </span>
            <code className="font-mono text-[13px] font-semibold text-ai-ink">{command.name}</code>
            <p className="col-start-2 text-[13px] leading-relaxed text-neutral-600">
              {command.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
