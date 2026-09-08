'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
}

/** Adds `is-visible` once the element scrolls into view; pairs with `.ai-typed`. */
export default function RevealOnScroll({ children, className = '' }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
