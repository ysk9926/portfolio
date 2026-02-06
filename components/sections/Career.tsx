import { careerData } from '../../data/career';
import SectionWrapper from '../ui/SectionWrapper';
import CareerItem from '../ui/CareerItem';
import AnimateOnScroll from '../ui/AnimateOnScroll';

export default function Career() {
  return (
    <SectionWrapper
      id="career"
      title="Career"
      className="bg-section-career"
      contentVisibility
    >
      <div className="space-y-8 max-w-3xl mx-auto">
        {careerData.map((entry, index) => (
          <AnimateOnScroll key={index}>
            <CareerItem {...entry} />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
