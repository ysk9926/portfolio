import Image from 'next/image';
import aboutData from '../../data/about.json';
import siteData from '../../data/site.json';
import { AboutItem } from '../../lib/types';
import { ABOUT_SUMMARY } from '../../lib/constants';
import SectionWrapper from '../ui/SectionWrapper';
import InfoCard from '../ui/InfoCard';
import AnimateOnScroll from '../ui/AnimateOnScroll';
import { User } from 'lucide-react';

const data = aboutData as AboutItem[];

export default function About() {
  return (
    <SectionWrapper id="about" title="About Me" className="bg-white">
      {/* Profile Image */}
      <div className="flex justify-center mb-10">
        <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-lg">
          {siteData.profileImage ? (
            <Image
              src={siteData.profileImage}
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

      {/* Professional Summary */}
      <AnimateOnScroll>
        <p className="text-center text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-10">
          {ABOUT_SUMMARY}
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
