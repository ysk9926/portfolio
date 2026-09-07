import { classifyTech } from '@/lib/projects/tech-category';

interface TechChipProps {
  name: string;
  size?: 'sm' | 'md';
}

/** Category-tinted tech chip. The dot and title carry the category so color is not the only cue. */
export default function TechChip({ name, size = 'sm' }: TechChipProps) {
  const category = classifyTech(name);
  return (
    <span
      title={category.label}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium leading-none transition-colors duration-200 ${
        size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      } ${category.chip}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${category.dot}`} />
      {name}
    </span>
  );
}
