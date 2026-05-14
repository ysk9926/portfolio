'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronRight, AlertCircle, Lightbulb, TrendingUp, Wrench, FolderCode } from 'lucide-react';
import { Project } from '@/lib/types';
import ImageSlider from './ImageSlider';
import MarkdownRenderer from './MarkdownRenderer';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  // Body scroll lock + focus management
  useEffect(() => {
    if (!project) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    // Focus modal on open
    const timer = setTimeout(() => {
      modalRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [project]);

  // ESC key handler
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, handleClose]);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  }, [isClosing, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!project) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${
        isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${project.star ? 'max-w-3xl' : 'max-w-2xl'} max-h-[85vh] bg-white rounded-3xl overflow-y-auto shadow-2xl outline-none ${
          isClosing ? 'modal-content-exit' : 'modal-content-enter'
        }`}
        onAnimationEnd={handleAnimationEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Hero image */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover"
              sizes={project.star ? '(max-width: 768px) 100vw, 768px' : '(max-width: 672px) 100vw, 672px'}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <FolderCode size={56} className="text-white/15" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-white/20 tracking-wide">{project.title}</span>
            </div>
          )}
        </div>

        {/* Screenshots */}
        {project.screenshots && project.screenshots.length > 0 && (
          <div className="px-6 md:px-8 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">스크린샷</h3>
            <ImageSlider screenshots={project.screenshots} alt={project.title} />
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Title + Period */}
          <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
          {project.star && (
            <span className="inline-block mt-2 bg-neutral-200 text-neutral-800 text-xs font-medium px-2.5 py-1 rounded-full">
              {project.star.role}
            </span>
          )}
          <p className="text-sm text-gray-500 mt-1 mb-3">{project.period}</p>
          {project.portfolioSync && (
            <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {project.portfolioSync.status && (
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
                    {project.portfolioSync.status}
                  </span>
                )}
                {project.portfolioSync.track && project.portfolioSync.track !== '-' && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                    {project.portfolioSync.track}
                  </span>
                )}
                {project.portfolioSync.company && (
                  <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700">
                    {project.portfolioSync.company}
                  </span>
                )}
                {project.portfolioSync.role && (
                  <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700">
                    {project.portfolioSync.role}
                  </span>
                )}
              </div>
            </div>
          )}

          {project.star ? (
            <>
              {/* STAR Layout */}
              <p className="text-gray-700 leading-relaxed mb-6">{project.star.summary}</p>

              {/* Background */}
              <div className="bg-neutral-100/70 rounded-2xl p-4 md:p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="text-neutral-600 shrink-0" size={18} />
                  <h3 className="font-semibold text-gray-900">프로젝트 배경</h3>
                </div>
                <MarkdownRenderer content={project.star.background} />
              </div>

              {/* Solutions */}
              <div className="border-l-3 border-neutral-400 pl-4 md:pl-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="text-neutral-600 shrink-0" size={18} />
                  <h3 className="font-semibold text-gray-900">핵심 구현</h3>
                </div>
                <MarkdownRenderer content={project.star.solutions} />
              </div>

              {/* Results */}
              <div className="bg-neutral-50 rounded-2xl p-4 md:p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="text-neutral-600 shrink-0" size={18} />
                  <h3 className="font-semibold text-gray-900">성과</h3>
                </div>
                <MarkdownRenderer content={project.star.results} />
              </div>

              {/* Troubleshooting (optional) */}
              {project.star.troubleshooting && (
                <div className="bg-neutral-100 rounded-2xl p-4 md:p-5 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="text-neutral-600 shrink-0" size={18} />
                    <h3 className="font-semibold text-gray-900">트러블슈팅</h3>
                  </div>
                  <MarkdownRenderer content={project.star.troubleshooting} />
                </div>
              )}
            </>
          ) : (
            /* Legacy Layout */
            <p className="text-gray-700 leading-relaxed mb-6">{project.description}</p>
          )}

          {/* Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">주요 기능</h3>
            <ul className="space-y-2">
              {project.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <ChevronRight className="text-neutral-600 mt-1 shrink-0" size={16} strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">기술 스택</h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech, i) => (
                <span
                  key={i}
                  className="bg-neutral-100 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3">
            {project.deployUrl && (
              <a
                href={project.deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-4 rounded-xl text-center transition-colors"
              >
                배포 사이트
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-xl text-center transition-colors"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
