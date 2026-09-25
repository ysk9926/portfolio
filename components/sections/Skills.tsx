import SectionWrapper from '../ui/SectionWrapper';
import AnimateOnScroll from '../ui/AnimateOnScroll';
import { SkillCategory } from '@/lib/types/view';

interface SkillsProps {
  categories: SkillCategory[];
}

/**
 * Compact stack inventory. Languages and frameworks are listed as evidence
 * (where each was used), not ranked with proficiency bars — the AI Workflow
 * section above carries the emphasis.
 */
export default function Skills({ categories }: SkillsProps) {
  const coreNames = [
    ['TypeScript', 'TypeScript'],
    ['React', 'React'],
    ['Next.js', 'Next.js'],
    ['Kotlin / Spring Boot', 'Kotlin · Spring Boot'],
    ['PostgreSQL', 'PostgreSQL'],
    ['Docker', 'Docker'],
    ['AWS (EC2/RDS/S3)', 'AWS'],
  ] as const;
  const allSkills = categories.flatMap((category) => category.skills);
  const core = coreNames.flatMap(([source, label]) => {
    const skill = allSkills.find((item) => item.name === source);
    return skill ? [{ ...skill, label }] : [];
  });
  const coreSourceNames = new Set<string>(coreNames.map(([source]) => source));
  const additional = categories.map((category) => ({
    ...category,
    skills: category.skills.filter((skill) => !coreSourceNames.has(skill.name)),
  })).filter((category) => category.skills.length > 0);

  return (
    <SectionWrapper
      id="skills"
      title="Tech Stack"
      className="ai-paper text-ai-ink"
    >
      <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center text-sm text-neutral-500 md:text-base">제품 개발에 주로 사용한 기술을 먼저, 나머지 실무 경험은 분야별로 정리했습니다.</p>

      <div className="mb-14">
        <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-ai-accent">Core Stack</h3>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {core.map((skill) => (
            <li key={skill.name} className="paper-card rounded-xl bg-white/80 p-4">
              <strong className="block text-base text-ai-ink">{skill.label}</strong>
              {skill.detail && <span className="mt-1 block text-xs text-neutral-500">{skill.detail}</span>}
            </li>
          ))}
        </ul>
      </div>

      <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">Also Worked With</h3>

      <div className="divide-y divide-ai-ink/10 border-y border-ai-ink/10">
        {additional.map((category) => (
          <AnimateOnScroll key={category.category}>
            <div className="grid gap-3 py-5 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8 md:py-6">
              <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500 md:pt-2">
                {category.category}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill.name}
                    className="inline-flex items-baseline gap-2 rounded-full border border-ai-ink/10 bg-white/80 px-3.5 py-1.5 transition-colors hover:border-ai-accent"
                  >
                    <span className="text-sm font-semibold text-ai-ink">{skill.name}</span>
                    {skill.detail && (
                      <span className="font-mono text-[10px] text-neutral-500">{skill.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
