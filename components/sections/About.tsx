import Image from 'next/image';
import { AboutItem } from '@/lib/types/view';
import SectionWrapper from '../ui/SectionWrapper';
import InfoCard from '../ui/InfoCard';
import AnimateOnScroll from '../ui/AnimateOnScroll';
import { User } from 'lucide-react';

interface AboutProps {
  data: AboutItem[];
  aboutSummary: string;
  profileImage: string;
}

export default function About({ data, aboutSummary, profileImage }: AboutProps) {
  return (
    <SectionWrapper id="about" title="About Me" className="bg-white">
      <div className="flex justify-center mb-10">
        <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-lg">
          {profileImage ? (
            <Image
              src={profileImage}
              alt="프로필 사진"
              fill
              className="object-cover"
              sizes="160px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
              <User size={64} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <AnimateOnScroll>
        <p className="text-center text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-10">
          {aboutSummary}
        </p>
      </AnimateOnScroll>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {data.map((item, index) => (
          <AnimateOnScroll key={index}>
            <InfoCard icon={item.icon} label={item.label} value={item.value} />
          </AnimateOnScroll>
        ))}
      </div>
    </SectionWrapper>
  );
}
