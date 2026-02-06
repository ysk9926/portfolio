import { NavItem } from './types';

export const SITE_CONFIG = {
  name: '홍길동 포트폴리오',
  title: '홍길동 | 프론트엔드 개발자 포트폴리오',
  description: '열정적인 프론트엔드 개발자 홍길동의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 프로젝트를 소개합니다.',
  url: 'https://portfolio.example.com',
  ogImage: '/og-image.png'
} as const;

export const NAV_ITEMS: NavItem[] = [
  { label: 'About Me', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Archiving', href: '#archiving' },
  { label: 'Projects', href: '#projects' },
  { label: 'Career', href: '#career' }
];
