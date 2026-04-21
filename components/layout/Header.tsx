'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NavItem } from '@/lib/types/view';

interface HeaderProps {
  navItems: NavItem[];
  heroName: string;
}

export default function Header({ navItems, heroName }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
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
      const element = document.querySelector(item.href);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [navItems]);

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
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
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#hero');
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
                  activeSection === item.href
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
                    activeSection === item.href
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
