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
    <SectionWrapper id="about" title="About Me" className="ai-cream text-ai-ink">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
        <AnimateOnScroll>
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-1 ring-ai-ink/10 md:h-28 md:w-28">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="프로필 사진"
                  fill
                  className="object-cover"
                  sizes="112px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                  <User size={40} className="text-neutral-400" />
                </div>
              )}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ai-accent">
                whoami
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                기획부터 배포까지, 끝까지 맡습니다
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-700 md:text-lg">
            {aboutSummary}
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="grid grid-cols-2 gap-3">
            {data.map((item) => (
              <InfoCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </SectionWrapper>
  );
}
