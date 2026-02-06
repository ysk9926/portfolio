import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '홍길동 | 프론트엔드 개발자 포트폴리오',
    short_name: '홍길동 포트폴리오',
    description:
      '열정적인 프론트엔드 개발자 홍길동의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 프로젝트를 소개합니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#1e293b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
