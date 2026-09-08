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
      className="ai-ink text-white"
      contentVisibility
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {data.map((item) => (
          <AnimateOnScroll key={item.title}>
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
