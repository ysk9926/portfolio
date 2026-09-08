import { ReactNode } from 'react';

interface SectionWrapperProps {
  id: string;
  title: string;
  /** Mono path-style label above the title, e.g. "~/about". Defaults to "~/{id}". */
  eyebrow?: string;
  className?: string;
  children: ReactNode;
  contentVisibility?: boolean;
  fullWidthContent?: boolean;
}

export default function SectionWrapper({
  id,
  title,
  eyebrow,
  className = '',
  children,
  contentVisibility = false,
  fullWidthContent = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      data-analytics-section={id}
      className={`${contentVisibility ? 'cv-auto' : ''} ${className}`}
    >
      <div className={`py-16 md:py-24 ${fullWidthContent ? '' : 'max-w-6xl mx-auto px-4'}`}>
        <div className={fullWidthContent ? 'max-w-6xl mx-auto px-4' : ''}>
          <div className="mb-12 text-center">
            <p className="font-mono text-xs tracking-[0.18em] text-ai-accent">
              {eyebrow ?? `~/${id}`}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {title}
              <span className="mx-auto mt-4 block h-1 w-12 rounded-full bg-ai-accent" />
            </h2>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
