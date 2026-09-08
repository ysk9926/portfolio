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
  return (
    <SectionWrapper id="ai-workflow" title="AI Workflow" className="ai-paper text-ai-ink">
      {/* Intro + stats */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
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

        <AnimateOnScroll>
          <dl className="grid grid-cols-2 gap-3">
            {data.stats.map((stat) => (
              <div
                key={stat.label}
                className="paper-card rounded-2xl p-5"
              >
                <dd className="font-mono text-4xl font-semibold leading-none tracking-tight text-ai-ink md:text-5xl">
                  {stat.value}
                </dd>
                <dt className="mt-3 text-sm font-medium text-ai-ink">{stat.label}</dt>
                {stat.note && (
                  <p className="mt-1 font-mono text-[11px] leading-snug text-neutral-500">
                    {stat.note}
                  </p>
                )}
              </div>
            ))}
          </dl>
        </AnimateOnScroll>
      </div>

      {/* Tools */}
      <div className="mt-20">
        <SubHeading index="01" title="쓰는 도구" hint="agents · models · products" />
        <div className="grid gap-4 md:grid-cols-3">
          {data.tools.map((tool, index) => (
            <AnimateOnScroll key={tool.name}>
              <AiToolCard tool={tool} index={index} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="mt-20">
        <SubHeading index="02" title="일하는 순서" hint="context → spec → plan → verify → record" />
        <AnimateOnScroll>
          <AiWorkflowPipeline steps={data.workflow} />
        </AnimateOnScroll>
      </div>

      {/* Skills */}
      <div className="mt-20">
        <SubHeading index="03" title="직접 만들고 관리하는 스킬" hint="~/.claude/skills · ~/.codex/skills" />
        <AnimateOnScroll>
          <AiSkillRegistry groups={data.skillGroups} />
        </AnimateOnScroll>
      </div>

      {/* Commands & automation */}
      <div className="mt-20">
        <SubHeading index="04" title="슬래시 커맨드 · 훅 · 자동화" hint="commands · hooks · launchd" />
        <AnimateOnScroll>
          <AiCommandList commands={data.commands} />
        </AnimateOnScroll>
      </div>
    </SectionWrapper>
  );
}
