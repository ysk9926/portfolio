import type { AiWorkflow as AiWorkflowData } from '@/lib/types/view';
import SectionWrapper from '../ui/SectionWrapper';
import AnimateOnScroll from '../ui/AnimateOnScroll';
import AiToolCard from '../ai/AiToolCard';
import AiWorkflowPipeline from '../ai/AiWorkflowPipeline';
import AiSkillRegistry from '../ai/AiSkillRegistry';
import AiCommandList from '../ai/AiCommandList';

interface AiWorkflowProps {
  data: AiWorkflowData;
}

function SubHeading({ index, title, hint }: { index: string; title: string; hint: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="font-mono text-xs text-ai-accent">{index}</span>
      <h3 className="text-xl font-bold tracking-tight text-ai-ink md:text-2xl">{title}</h3>
      <p className="font-mono text-xs text-neutral-500">{hint}</p>
    </div>
  );
}

export default function AiWorkflow({ data }: AiWorkflowProps) {
  const automations = data.commands.filter((command) => command.kind === 'automation').slice(0, 3);
  return (
    <SectionWrapper id="ai-workflow" title="AI Workflow" className="ai-paper text-ai-ink">
      {/* Summary */}
      <div className="max-w-3xl">
        <AnimateOnScroll>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
            {data.eyebrow}
          </p>
          <h3 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ai-ink md:text-4xl">
            {data.headline}
          </h3>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-700 md:text-lg">
            {data.intro}
          </p>
        </AnimateOnScroll>

      </div>

      <div className="mt-14">
        <SubHeading index="01" title="일하는 순서" hint="context → spec → plan → verify → record" />
        <AnimateOnScroll>
          <AiWorkflowPipeline steps={data.workflow} />
        </AnimateOnScroll>
      </div>

      <div className="mt-16">
        <SubHeading index="02" title="대표 자동화" hint="반복 작업을 운영 가능한 흐름으로" />
        <div className="grid gap-3 md:grid-cols-3">
          {automations.map((command) => (
            <article key={command.name} className="paper-card rounded-xl bg-white/80 p-5">
              <h4 className="font-semibold text-ai-ink">{command.name}</h4>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{command.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-20 border-t border-ai-ink/10 pt-14">
        <SubHeading index="03" title="운영 규모와 도구" hint="detailed evidence" />
        <dl className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((stat) => (
            <div key={stat.label} className="paper-card rounded-xl p-5">
              <dd className="font-mono text-3xl font-semibold text-ai-ink">{stat.value}</dd>
              <dt className="mt-2 text-sm font-medium text-ai-ink">{stat.label}</dt>
              {stat.note && <p className="mt-1 text-xs text-neutral-500">{stat.note}</p>}
            </div>
          ))}
        </dl>
        <div className="grid gap-4 md:grid-cols-3">
          {data.tools.map((tool, index) => (
            <AnimateOnScroll key={tool.name}><AiToolCard tool={tool} index={index} /></AnimateOnScroll>
          ))}
        </div>
      </div>

      <div className="mt-20">
        <SubHeading index="04" title="직접 만들고 관리하는 스킬" hint="~/.claude/skills · ~/.codex/skills" />
        <AnimateOnScroll>
          <AiSkillRegistry groups={data.skillGroups} />
        </AnimateOnScroll>
      </div>

      <div className="mt-20">
        <SubHeading index="05" title="슬래시 커맨드 · 훅 · 자동화" hint="commands · hooks · launchd" />
        <AnimateOnScroll>
          <AiCommandList commands={data.commands} />
        </AnimateOnScroll>
      </div>
    </SectionWrapper>
  );
}
