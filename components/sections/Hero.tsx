import { ArrowDown } from 'lucide-react';
import { HERO_DATA } from '@/lib/constants';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4"
    >
      <div className="text-center space-y-6">
        <p className="text-lg md:text-xl text-neutral-400">{HERO_DATA.greeting}</p>
        <h1 className="text-5xl md:text-7xl font-bold">
          <span className="text-white">
            {HERO_DATA.name}
          </span>
          <span className="sr-only"> - {HERO_DATA.role} 포트폴리오</span>
        </h1>
        <p className="text-2xl md:text-3xl text-neutral-200 font-semibold">
          {HERO_DATA.role}
        </p>
        <p className="text-base md:text-lg text-neutral-500 max-w-2xl mx-auto whitespace-pre-line">
          {HERO_DATA.tagline}
        </p>
        <div className="pt-8">
          <a
            href="#about"
            className="inline-block bg-white text-gray-900 rounded-full px-8 py-3 font-semibold hover:bg-gray-100 transition-colors"
          >
            {HERO_DATA.cta}
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 animate-bounce-arrow">
        <ArrowDown className="w-6 h-6 text-white" strokeWidth={2} />
      </div>
    </section>
  );
}
