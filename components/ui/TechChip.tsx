import { classifyTech } from '@/lib/projects/tech-category';

interface TechChipProps {
  name: string;
  size?: 'sm' | 'md';
}

/** Neutral tech chip; the colored dot and tooltip carry the category. */
export default function TechChip({ name, size = 'sm' }: TechChipProps) {
  const category = classifyTech(name);
  return (
    <span
      title={category.label}
      className={`inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white font-medium leading-none text-neutral-700 transition-colors duration-200 hover:border-neutral-300 hover:bg-neutral-50 ${
        size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${category.dot}`} />
      {name}
    </span>
  );
}
