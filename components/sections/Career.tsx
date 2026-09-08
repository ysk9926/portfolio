import { CareerEntry } from '@/lib/types/view';
import SectionWrapper from '../ui/SectionWrapper';
import CareerItem from '../ui/CareerItem';
import AnimateOnScroll from '../ui/AnimateOnScroll';

interface CareerProps {
  data: CareerEntry[];
}

export default function Career({ data }: CareerProps) {
  return (
    <SectionWrapper
      id="career"
      title="Career"
      className="ai-cream text-ai-ink"
      contentVisibility
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {data.map((entry) => (
          <AnimateOnScroll key={`${entry.company}-${entry.period}`}>
            <CareerItem {...entry} />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
