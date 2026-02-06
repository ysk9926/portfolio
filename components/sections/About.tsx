import { aboutData } from '../../data/about';
import SectionWrapper from '../ui/SectionWrapper';
import InfoCard from '../ui/InfoCard';
import AnimateOnScroll from '../ui/AnimateOnScroll';

export default function About() {
  return (
    <SectionWrapper id="about" title="About Me" className="bg-white">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {aboutData.map((item, index) => (
          <AnimateOnScroll key={index}>
            <InfoCard icon={item.icon} label={item.label} value={item.value} />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
