import { ArchiveItem } from '@/lib/types/view';
import SectionWrapper from '../ui/SectionWrapper';
import ArchiveCard from '../ui/ArchiveCard';
import AnimateOnScroll from '../ui/AnimateOnScroll';

interface ArchivingProps {
  data: ArchiveItem[];
}

export default function Archiving({ data }: ArchivingProps) {
  return (
    <SectionWrapper
      id="archiving"
      title="Archiving"
      className="bg-section-archiving text-white [&_h2]:text-white"
      contentVisibility
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {data.map((item, index) => (
          <AnimateOnScroll key={index}>
            <ArchiveCard
              title={item.title}
              description={item.description}
              url={item.url}
              details={item.details}
            />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
