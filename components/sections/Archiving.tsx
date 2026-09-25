import { ActivityHeatmap as ActivityHeatmapType, ArchiveItem } from '@/lib/types/view';
import SectionWrapper from '../ui/SectionWrapper';
import ArchiveCard from '../ui/ArchiveCard';
import AnimateOnScroll from '../ui/AnimateOnScroll';
import ActivityHeatmap from './ActivityHeatmap';

interface ArchivingProps {
  data: ArchiveItem[];
  heatmap: ActivityHeatmapType;
}

export default function Archiving({ data, heatmap }: ArchivingProps) {
  return (
    <SectionWrapper
      id="archiving"
      title="Archive"
      className="ai-ink text-white"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
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
      <ActivityHeatmap heatmap={heatmap} embedded />
    </SectionWrapper>
  );
}
