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
      className="ai-ink relative flex min-h-screen flex-col items-center justify-center px-4 text-white"
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
        <p className="font-mono text-sm text-ai-accent md:text-base">
          @{PROFILE_HANDLE}
        </p>
        <p className="mx-auto max-w-4xl break-keep text-xl font-semibold leading-snug text-neutral-200 sm:text-2xl md:text-3xl">
          {heroData.role}
        </p>
        <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto whitespace-pre-line">
          {heroData.tagline}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 pt-8 sm:flex-row">
          <a
            href="#projects"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-ai-ink transition-colors hover:bg-ai-accent-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {heroData.cta}
          </a>
          <a
            href="/resume/portfolio.pdf"
            data-analytics-target="resume"
            download="윤승규-포트폴리오.pdf"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 font-semibold text-white transition-colors hover:border-ai-accent hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Download aria-hidden size={18} />
            포트폴리오 PDF
          </a>
          {publicEmail && (
            <a
              href={`mailto:${publicEmail}`}
              data-analytics-target="email"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 font-semibold text-white transition-colors hover:border-ai-accent hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
            About
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 animate-bounce-arrow">
        <ArrowDown className="h-6 w-6 text-ai-accent" strokeWidth={2} />
      </div>
    </section>
  );
}
