import { ArrowDown, Download, Github, Mail } from 'lucide-react';
import { HeroData } from '@/lib/types/view';
import { PROFILE_HANDLE } from '@/lib/seo/profile';

interface HeroProps {
  heroData: HeroData;
  publicEmail?: string;
}

export default function Hero({ heroData, publicEmail }: HeroProps) {
  return (
    <section
      id="hero"
      data-analytics-section="hero"
      className="relative min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4"
    >
      <div className="text-center space-y-6">
        <p className="text-lg md:text-xl text-neutral-400">{heroData.greeting}</p>
        <h1 className="text-5xl md:text-7xl font-bold">
          <span className="text-white">{heroData.name}</span>
          <span className="sr-only">
            {' '}
            - {PROFILE_HANDLE} {heroData.role} 포트폴리오
          </span>
        </h1>
        <p className="text-sm md:text-base font-medium tracking-normal text-neutral-400">
          @{PROFILE_HANDLE}
        </p>
        <p className="text-2xl md:text-3xl text-neutral-200 font-semibold">
          {heroData.role}
        </p>
        <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto whitespace-pre-line">
          {heroData.tagline}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 pt-8 sm:flex-row">
          <a
            href="/resume/portfolio.pdf"
            data-analytics-target="resume"
            download="윤승규-포트폴리오.pdf"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Download aria-hidden size={18} />
            포트폴리오 PDF 다운로드
          </a>
          {publicEmail && (
            <a
              href={`mailto:${publicEmail}`}
              data-analytics-target="email"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <Mail aria-hidden size={18} />
              이메일로 연락하기
            </a>
          )}
        </div>
        <div className="flex items-center justify-center gap-5 text-sm font-medium text-neutral-300">
          <a
            href="https://github.com/ysk9926"
            data-analytics-target="github"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Github aria-hidden size={16} />
            GitHub
          </a>
          <a
            href="#about"
            className="inline-flex min-h-11 items-center underline decoration-white/30 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {heroData.cta}
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 animate-bounce-arrow">
        <ArrowDown className="w-6 h-6 text-white" strokeWidth={2} />
      </div>
    </section>
  );
}
