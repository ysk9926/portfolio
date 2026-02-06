'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Project } from '@/lib/types';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  }, [project, isClosing]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

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

  if (!mounted || !project) return null;

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
        className={`relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl overflow-y-auto shadow-2xl outline-none ${
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Hero image */}
        <div className="relative aspect-video w-full bg-indigo-700">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white/30">{project.title}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Title + Period */}
          <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">{project.period}</p>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed mb-6">{project.description}</p>

          {/* Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">주요 기능</h3>
            <ul className="space-y-2">
              {project.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600">
                  <span className="text-blue-500 mt-1 shrink-0">•</span>
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
                  className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full"
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
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl text-center transition-colors"
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
