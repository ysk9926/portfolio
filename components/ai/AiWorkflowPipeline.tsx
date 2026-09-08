import type { AiWorkflowStep } from '@/lib/types/view';
import RevealOnScroll from './RevealOnScroll';

interface AiWorkflowPipelineProps {
  steps: AiWorkflowStep[];
}

/** Terminal-transcript style list: one prompt line per workflow step. */
export default function AiWorkflowPipeline({ steps }: AiWorkflowPipelineProps) {
  return (
    <div className="ai-console overflow-hidden rounded-2xl text-neutral-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </span>
        <p className="font-mono text-xs text-neutral-400">
          ~/workflow <span className="text-neutral-600">—</span> {steps.length} steps
        </p>
      </div>

      <RevealOnScroll className="ai-typed divide-y divide-white/[0.06]">
        {steps.map((step, index) => (
          <div
            key={step.step}
            className="grid gap-3 px-5 py-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.15fr)] md:gap-6 md:px-7"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            <div className="flex items-center gap-3 md:items-start">
              <span aria-hidden className="font-mono text-ai-accent">$</span>
              <span className="font-mono text-2xl font-semibold leading-none tracking-tight text-white md:text-3xl">
                {step.step}
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-white md:text-lg">{step.title}</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {step.skills.map((skill) => (
                  <code
                    key={skill}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-neutral-300"
                  >
                    {skill}
                  </code>
                ))}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-neutral-300">{step.description}</p>
          </div>
        ))}

        <div className="flex items-center gap-2 px-5 py-4 font-mono text-xs text-neutral-500 md:px-7">
          <span className="text-ai-accent">$</span>
          <span>done</span>
          <span aria-hidden className="inline-block h-3.5 w-[7px] animate-caret-blink bg-ai-accent/80" />
        </div>
      </RevealOnScroll>
    </div>
  );
}
