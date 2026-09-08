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
  return (
    <SectionWrapper
      id="skills"
      title="Tech Stack"
      className="bg-section-skills"
      contentVisibility
    >
      <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center text-sm text-neutral-500 md:text-base">
        실무에서 쓴 스택입니다. 각 항목의 근거는 프로젝트 수와 운영 기간으로 적었습니다.
      </p>

      <div className="divide-y divide-neutral-200 border-y border-neutral-200">
        {categories.map((category) => (
          <AnimateOnScroll key={category.category}>
            <div className="grid gap-3 py-5 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8 md:py-6">
              <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500 md:pt-2">
                {category.category}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill.name}
                    className="inline-flex items-baseline gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 transition-colors hover:border-neutral-400"
                  >
                    <span className="text-sm font-semibold text-neutral-900">{skill.name}</span>
                    {skill.detail && (
                      <span className="text-[11px] text-neutral-500">{skill.detail}</span>
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
