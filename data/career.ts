import { CareerEntry } from '../lib/types';

export const careerData: CareerEntry[] = [
  {
    company: '(주)테크컴퍼니',
    role: '프론트엔드 개발자',
    period: '2023.03 - 현재',
    description: 'React와 TypeScript를 활용한 웹 애플리케이션 개발 및 유지보수를 담당하고 있습니다.',
    achievements: [
      'React 기반 사내 관리 시스템 개발 및 성능 최적화',
      'TypeScript 도입으로 코드 품질 향상 및 버그 감소',
      'Storybook을 활용한 컴포넌트 문서화 및 디자인 시스템 구축',
      '코드 리뷰 문화 정착 및 팀 내 기술 공유 세션 진행',
      'Lighthouse 점수 30% 향상을 통한 사용자 경험 개선'
    ]
  },
  {
    company: '(주)스타트업',
    role: '주니어 개발자',
    period: '2022.01 - 2023.02',
    description: '스타트업에서 풀스택 개발자로 근무하며 다양한 프로젝트에 참여했습니다.',
    achievements: [
      'React를 활용한 반응형 웹 애플리케이션 개발',
      'Node.js와 Express를 이용한 RESTful API 개발',
      'MongoDB를 활용한 데이터베이스 설계 및 관리',
      'Git을 활용한 버전 관리 및 협업 경험',
      '애자일 방법론을 통한 스프린트 단위 개발 경험'
    ]
  }
];
