import Image from 'next/image';
import { ArrowRight, FolderCode } from 'lucide-react';
import { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  onDetailClick: (project: Project) => void;
}

export default function ProjectCard({ project, onDetailClick }: ProjectCardProps) {
  const shortDesc =
    project.shortDescription ||
    project.description.slice(0, 80) + (project.description.length > 80 ? '...' : '');

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
          sizes="(max-width: 768px) calc(100vw - 3rem), 480px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900
                        transition duration-500 ease-out
                        md:group-hover/card:brightness-75">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 -translate-y-4">
            <FolderCode size={48} className="text-white/20" strokeWidth={1.5} />
            <span className="text-sm font-medium text-white/25 tracking-wide">
              {project.title}
            </span>
          </div>
        </div>
      )}

      {/* Bottom overlay — always-visible base info + hover reveal */}
      <div className="absolute inset-x-0 bottom-0
                      bg-gradient-to-t from-black/85 via-black/50 to-transparent
                      transition-all duration-500 ease-out">
        <div className="p-4 md:p-5">
          <h3 className="text-lg md:text-xl font-bold text-white">{project.title}</h3>
          <p className="text-sm text-white/60 mt-0.5">{project.period}</p>

          {/* Tech tags — always visible, glassmorphism */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* 모바일+데스크톱 공통: 처음 3개 */}
            {project.techStack.slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full
                           bg-white/10 backdrop-blur-sm text-white/80
                           border border-white/20"
              >
                {tech}
              </span>
            ))}
            {/* 데스크톱 전용: 4~5번째 */}
            {project.techStack.slice(3, 5).map((tech, i) => (
              <span
                key={i + 3}
                className="hidden md:inline-flex text-xs px-2.5 py-0.5 rounded-full
                           bg-white/10 backdrop-blur-sm text-white/80
                           border border-white/20"
              >
                {tech}
              </span>
            ))}
            {/* 모바일 "+N" 카운터 (3개 초과 시) */}
            {project.techStack.length > 3 && (
              <span className="md:hidden text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                +{project.techStack.length - 3}
              </span>
            )}
            {/* 데스크톱 "+N" 카운터 (5개 초과 시) */}
            {project.techStack.length > 5 && (
              <span className="hidden md:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-white/50">
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
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
