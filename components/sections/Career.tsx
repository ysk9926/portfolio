import careerData from '../../data/career.json';
import { CareerEntry } from '../../lib/types';
import SectionWrapper from '../ui/SectionWrapper';
import CareerItem from '../ui/CareerItem';
import AnimateOnScroll from '../ui/AnimateOnScroll';

const data = careerData as CareerEntry[];

export default function Career() {
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
