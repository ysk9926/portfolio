import Image from 'next/image';
import { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  onDetailClick: (project: Project) => void;
}

export default function ProjectCard({ project, onDetailClick }: ProjectCardProps) {
  const shortDesc =
    project.shortDescription ||
    project.description.slice(0, 80) + (project.description.length > 80 ? '...' : '');

  const displayedTechs = project.techStack.slice(0, 5);

  const handleCardClick = () => {
    onDetailClick(project);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDetailClick(project);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDetailClick(project);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${project.title} 상세 보기`}
      className="group/card relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {/* Background image — zoom + dim on hover */}
      {project.thumbnail ? (
        <Image
          src={project.thumbnail}
          alt={project.title}
          fill
          className="object-cover transition duration-500 ease-out
                     md:group-hover/card:scale-105 md:group-hover/card:brightness-75"
          sizes="(max-width: 768px) 280px, 480px"
        />
      ) : (
        <div className="absolute inset-0 bg-indigo-700
                        transition duration-500 ease-out
                        md:group-hover/card:brightness-75" />
      )}

      {/* Bottom overlay — always-visible base info + hover reveal */}
      <div className="absolute inset-x-0 bottom-0
                      bg-black/70
                      transition-all duration-500 ease-out
                      md:group-hover/card:bg-black/80">
        <div className="p-5">
          <h3 className="text-lg md:text-xl font-bold text-white">{project.title}</h3>
          <p className="text-sm text-white/60 mt-0.5">{project.period}</p>

          {/* Tech tags — always visible, glassmorphism */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {displayedTechs.map((tech, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-0.5 rounded-full
                           bg-white/10 backdrop-blur-sm text-white/80
                           border border-white/20"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 5 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-white/50">
                +{project.techStack.length - 5}
              </span>
            )}
          </div>

          {/* Expandable area — reveal on desktop hover (grid-rows transition) */}
          <div className="grid transition-all duration-500 ease-out
                          grid-rows-[0fr] md:group-hover/card:grid-rows-[1fr]
                          opacity-0 md:group-hover/card:opacity-100">
            <div className="overflow-hidden">
              <p className="text-sm text-slate-300 mt-3 line-clamp-2">{shortDesc}</p>
              <button
                onClick={handleButtonClick}
                className="mt-3 inline-flex items-center gap-1.5
                           bg-white text-slate-900 font-medium text-sm
                           px-5 py-2 rounded-full hover:bg-slate-100
                           transition-colors cursor-pointer"
              >
                자세히 보기
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
