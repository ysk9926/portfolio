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
      className="bg-section-career"
      contentVisibility
    >
      <div className="space-y-8 max-w-3xl mx-auto">
        {data.map((entry, index) => (
          <AnimateOnScroll key={index}>
            <CareerItem {...entry} />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
