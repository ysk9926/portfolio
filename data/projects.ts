import { Project } from '../lib/types';

export const projectsData: Project[] = [
  {
    id: 1,
    title: '포트폴리오 웹사이트',
    period: '2024.01 - 2024.02',
    description: '개인 포트폴리오를 소개하는 반응형 웹사이트입니다. Next.js와 TypeScript를 활용하여 성능과 SEO를 최적화했습니다.',
    features: [
      '반응형 디자인으로 모바일, 태블릿, 데스크톱 대응',
      'Next.js App Router를 활용한 페이지 라우팅',
      'Tailwind CSS를 이용한 모던한 UI/UX 구현',
      '다크모드 지원 및 부드러운 스크롤 애니메이션',
      'SEO 최적화 및 메타 태그 설정'
    ],
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    deployUrl: 'https://portfolio.example.com',
    githubUrl: 'https://github.com/example/portfolio',
    isMain: true,
    thumbnail: '',
    shortDescription: 'Next.js와 TypeScript로 만든 반응형 포트폴리오 웹사이트',
  },
  {
    id: 2,
    title: '쇼핑몰 플랫폼',
    period: '2023.09 - 2023.12',
    description: '사용자 친화적인 전자상거래 플랫폼입니다. 상품 검색, 장바구니, 결제 기능을 구현했습니다.',
    features: [
      '회원가입, 로그인 및 사용자 인증 시스템',
      '상품 목록 조회 및 상세 페이지 구현',
      '장바구니 기능 및 주문 관리',
      '관리자 페이지를 통한 상품 및 주문 관리',
      'RESTful API 설계 및 구현'
    ],
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT'],
    githubUrl: 'https://github.com/example/shopping-mall',
    isMain: true,
    thumbnail: '',
    shortDescription: '상품 검색, 장바구니, 결제 기능을 갖춘 전자상거래 플랫폼',
  },
  {
    id: 3,
    title: '날씨 앱',
    period: '2023.07 - 2023.08',
    description: 'OpenWeather API를 활용한 실시간 날씨 정보 제공 애플리케이션입니다.',
    features: [
      '현재 위치 기반 날씨 정보 표시',
      '도시 검색을 통한 전 세계 날씨 조회',
      '5일간의 날씨 예보 제공',
      '온도, 습도, 풍속 등 상세 정보 표시',
      '직관적인 UI와 날씨 아이콘 표시'
    ],
    techStack: ['React', 'OpenWeather API', 'CSS3', 'Axios'],
    deployUrl: 'https://weather-app.example.com',
    githubUrl: 'https://github.com/example/weather-app',
    isMain: false,
    thumbnail: '',
    shortDescription: 'OpenWeather API를 활용한 실시간 날씨 정보 앱',
  },
  {
    id: 4,
    title: '투두 리스트',
    period: '2023.05 - 2023.06',
    description: 'Firebase를 활용한 실시간 할 일 관리 애플리케이션입니다.',
    features: [
      '할 일 추가, 수정, 삭제 기능',
      '완료/미완료 상태 토글',
      '카테고리별 할 일 분류',
      'Firebase Authentication을 통한 사용자 인증',
      'Firestore를 활용한 실시간 데이터 동기화'
    ],
    techStack: ['React', 'Firebase', 'Firestore', 'CSS Modules'],
    deployUrl: 'https://todo-app.example.com',
    githubUrl: 'https://github.com/example/todo-app',
    isMain: false,
    thumbnail: '',
    shortDescription: 'Firebase 기반 실시간 할 일 관리 앱',
  }
];
