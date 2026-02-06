'use client';

import { useEffect, useRef, useState } from 'react';

interface SkillBarProps {
  name: string;
  level: number;
  color: string;
  index: number;
}

export default function SkillBar({ name, level, color, index }: SkillBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = barRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, []);

  return (
    <div ref={barRef} className="mb-4">
      <span className="text-sm md:text-base font-medium text-gray-900 mb-1 block">
        {name}
      </span>
      <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: isVisible ? `${level}%` : '0%',
            backgroundColor: color,
            transitionDelay: `${index * 100}ms`,
          }}
        />
      </div>
    </div>
  );
}
