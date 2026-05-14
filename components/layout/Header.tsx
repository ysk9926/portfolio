'use client';

import { useState, useEffect } from 'react';
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
  const isScrolled = !onHome || scrolledPastThreshold;

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
            ? 'backdrop-blur-md bg-white/80 shadow-sm'
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
            className={`text-xl font-bold transition-colors ${
              isScrolled
                ? 'text-gray-900 hover:text-neutral-500'
                : 'text-white hover:text-neutral-300'
            }`}
          >
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
                className={`transition-colors ${
                  isActive(item.href)
                    ? isScrolled
                      ? 'text-neutral-900 font-semibold'
                      : 'text-white font-semibold'
                    : isScrolled
                      ? 'text-gray-600 hover:text-neutral-900'
                      : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <Menu className={`w-6 h-6 transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-8 gap-6">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="self-end text-gray-600 hover:text-gray-900"
                aria-label="Close menu"
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
                  className={`text-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-neutral-900 font-semibold'
                      : 'text-gray-600 hover:text-neutral-900'
                  }`}
                >
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
