import { ReactNode } from 'react';

interface SectionWrapperProps {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
  contentVisibility?: boolean;
  fullWidthContent?: boolean;
}

export default function SectionWrapper({
  id,
  title,
  className = '',
  children,
  contentVisibility = false,
  fullWidthContent = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`${contentVisibility ? 'cv-auto' : ''} ${className}`}
    >
      <div className={`py-16 md:py-24 ${fullWidthContent ? '' : 'max-w-6xl mx-auto px-4'}`}>
        <div className={fullWidthContent ? 'max-w-6xl mx-auto px-4' : ''}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {title}
            <span className="block w-12 h-1 bg-blue-500 mx-auto mt-4 rounded-full" />
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}
