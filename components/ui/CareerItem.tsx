import { CareerEntry } from '@/lib/types';

export default function CareerItem({
  company,
  role,
  period,
  description,
  achievements,
}: CareerEntry) {
  return (
    <article className="paper-card relative overflow-hidden rounded-2xl p-6 md:p-8">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-ai-accent" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-xl font-bold tracking-tight text-ai-ink md:text-2xl">{company}</h3>
        <p className="font-mono text-xs text-ai-accent">{period}</p>
      </div>
      <p className="mt-1 text-base font-medium text-neutral-700 md:text-lg">{role}</p>
      <p className="mt-4 leading-relaxed text-neutral-700">{description}</p>

      <div className="mt-6 border-t border-ai-ink/10 pt-5">
        <h4 className="font-mono text-[11px] tracking-[0.16em] text-neutral-500">
          $ ls achievements
        </h4>
        <ul className="mt-3 space-y-2.5">
          {achievements.map((achievement) => (
            <li key={achievement} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-700">
              <span aria-hidden className="mt-0.5 shrink-0 font-mono text-ai-accent">›</span>
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
