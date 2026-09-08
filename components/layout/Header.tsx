'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NavItem } from '@/lib/types/view';

interface HeaderProps {
  navItems: NavItem[];
  heroName: string;
}

const isAnchorHref = (href: string) => href.startsWith('#');

export default function Header({ navItems, heroName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const onHome = pathname === '/';
  const [scrolledPastThreshold, setScrolledPastThreshold] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isScrolled = !onHome || scrolledPastThreshold;

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!onHome) return;
    const handleScroll = () => {
      setScrolledPastThreshold(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onHome]);

  useEffect(() => {
    if (!onHome) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { root: null, rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );

    navItems.forEach((item) => {
      if (!isAnchorHref(item.href)) return;
      const element = document.querySelector(item.href);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [navItems, onHome]);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (isAnchorHref(href)) {
      if (!onHome) {
        router.push(`/${href}`);
        return;
      }
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    router.push(href);
  };

  const isActive = (href: string) => {
    if (isAnchorHref(href)) return onHome && activeSection === href;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-ai-ink/10 bg-[#f6f3ee]/85 backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a
            href={onHome ? '#hero' : '/'}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(onHome ? '#hero' : '/');
            }}
            className={`inline-flex items-center gap-2 text-xl font-bold tracking-tight transition-colors ${
              isScrolled
                ? 'text-ai-ink hover:text-ai-accent'
                : 'text-white hover:text-ai-accent'
            }`}
          >
            <span aria-hidden className="font-mono text-base text-ai-accent">~</span>
            {heroName}
          </a>

          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className={`relative py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-ai-accent after:transition-transform after:duration-300 ${
                  isActive(item.href)
                    ? `after:scale-x-100 ${isScrolled ? 'text-ai-ink' : 'text-white'}`
                    : `after:scale-x-0 hover:after:scale-x-100 ${
                        isScrolled
                          ? 'text-neutral-600 hover:text-ai-ink'
                          : 'text-neutral-300 hover:text-white'
                      }`
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className={`w-6 h-6 transition-colors ${isScrolled ? 'text-ai-ink' : 'text-white'}`} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            id="mobile-navigation"
            className="ai-cream fixed inset-y-0 right-0 w-64 border-l border-ai-ink/10 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-8 gap-6">
              <button
                ref={closeButtonRef}
                onClick={() => setIsMobileMenuOpen(false)}
                className="self-end flex h-11 w-11 items-center justify-center rounded-full text-neutral-600 hover:text-ai-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai-accent"
                aria-label="메뉴 닫기"
              >
                <X className="w-6 h-6" />
              </button>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className={`inline-flex items-center gap-2 text-lg transition-colors ${
                    isActive(item.href)
                      ? 'font-semibold text-ai-ink'
                      : 'text-neutral-600 hover:text-ai-ink'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`font-mono text-sm ${isActive(item.href) ? 'text-ai-accent' : 'text-neutral-400'}`}
                  >
                    {isAnchorHref(item.href) ? '~' : '/'}
                  </span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
