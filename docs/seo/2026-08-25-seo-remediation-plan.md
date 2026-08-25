# 포트폴리오 SEO 개선 계획

- 작성일: 2026-08-25
- 기준 사이트: `https://portfolio-pink-two-vymvu56oaw.vercel.app`
- 기준 점수: SEO Health 78/100
- 목표: 검색 노출 기반은 유지하면서 모바일 LCP, 채용 전환, 접근성, 증거 신뢰도를 개선한다.

## 1. 성공 기준

### 배포 직후 기술 기준

- 사이트맵 64개 URL의 200 응답, self-canonical, index/follow 상태를 유지한다.
- 모바일 Lighthouse Performance를 49에서 80 이상으로 높인다.
- 모바일 lab LCP를 22.5초에서 2.5초 이하로 낮춘다.
- CLS는 현재 0을 유지하고 TBT는 200ms 이하를 목표로 한다.
- Lighthouse SEO 100, Accessibility 94 이상을 유지한다.
- 폰트 초기 전송량을 현재 약 3.9MiB에서 500KiB 이하로 줄인다.

### 사용자 행동 기준

- 첫 화면에서 이력서 다운로드와 이메일 문의를 한 번의 클릭으로 수행할 수 있다.
- 모든 프로젝트 상세 링크는 프로젝트명을 포함한 접근 가능한 이름을 가진다.
- 활동 그래프는 키보드 사용자가 수백 개 셀을 순서대로 통과하지 않아도 탐색할 수 있다.
- 대표 프로젝트 3개는 역할, 문제, 행동, 결과, 검증 자료를 10초 안에 파악할 수 있다.

## 2. 작업 순서

## Phase 1 — 성능 병목 제거

예상 우선순위: P0  
예상 작업량: 0.5~1일

### 1.1 Pretendard 로딩 축소

대상 파일:

- `app/layout.tsx`
- 필요 시 `app/globals.css`

현재 `next/font/local`에 Regular, Medium, SemiBold, Bold, ExtraBold 5개 완성형 한글 폰트를 등록해 모든 파일이 preload된다.

수정안:

1. 가장 먼저 Regular 400과 Bold 700 두 굵기만 남긴 실험 빌드를 만든다.
2. 디자인 차이가 허용되면 500/600/800 사용처를 CSS 합성 또는 400/700으로 매핑한다.
3. 품질이 부족하면 Pretendard Variable 또는 한글 subset 구성을 검토한다.
4. 첫 화면에서 사용하지 않는 폰트는 preload하지 않는다.
5. 기존 `display: 'swap'`은 유지한다.

검증:

- `npm run build`
- 모바일 Lighthouse 3회 실행 후 중앙값 기록
- Network 탭에서 woff2 요청 수와 총 전송량 확인
- 390px/1440px 화면에서 폰트 전환, 줄바꿈, CLS 비교

완료 조건:

- 초기 폰트 요청 1~2개
- 폰트 전송량 500KiB 이하
- LCP 2.5초 이하 또는 기존 대비 70% 이상 개선

### 1.2 클라이언트 JavaScript 비용 점검

대상 파일:

- `components/sections/ActivityHeatmap.tsx`
- `components/sections/Projects.tsx`
- `components/ui/ProjectTimelineView.tsx`
- `components/ui/ProjectVerticalTimelineView.tsx`

수정안:

- 프로젝트 뷰 세 종류를 초기 번들에 모두 포함하지 않도록 비활성 뷰를 dynamic import한다.
- Activity 데이터의 서버 전처리 가능 범위를 확인해 클라이언트 계산량과 직렬화 payload를 줄인다.
- 초기 화면에 필요하지 않은 상호작용 컴포넌트는 지연 로딩한다.
- 번들 분석 후 효과가 확인된 항목만 반영한다.

완료 조건:

- TBT 200ms 이하를 목표로 하고, 최소한 현재 1,050ms 대비 50% 이상 줄인다.
- 기능과 SSR 본문 노출은 그대로 유지한다.

## Phase 2 — 채용 전환과 내부 링크 개선

예상 우선순위: P0  
예상 작업량: 1일

### 2.1 첫 화면 CTA 추가

대상 파일:

- `components/sections/Hero.tsx`
- `data/site.json`
- `lib/types/view.ts`
- `components/admin/editors/SiteEditor.tsx`
- `app/(site)/page.tsx`

수정안:

- 기존 `더 알아보기`를 보조 탐색 링크로 낮춘다.
- 기본 CTA: `이력서 다운로드`
- 보조 CTA: `이메일로 연락하기`
- 동일한 CTA를 Projects 또는 Career 다음에도 반복한다.
- CTA 클릭을 GA 이벤트로 측정한다.

콘텐츠 의존성:

- 공개할 이력서 파일을 `docs/resume/career.pdf`와 `docs/resume/portfolio.pdf` 중 하나로 확정해야 한다.
- 공개 이메일 주소와 표시 방식이 필요하다. 스팸 방지를 원하면 문의 폼 또는 별도 공개용 주소를 사용한다.
- 가능하면 `구직/협업 가능 여부`와 예상 응답 시간을 짧게 명시한다.

완료 조건:

- 모바일 첫 화면에 최소 한 개 CTA가 스크롤 없이 보인다.
- 키보드 포커스와 접근 가능한 이름이 명확하다.
- 다운로드/문의 이벤트가 GA DebugView에서 확인된다.

### 2.2 프로젝트 링크 문맥화

대상 파일:

- `components/ui/ProjectCard.tsx`
- `components/ui/ProjectTimelineView.tsx`
- `components/ui/ProjectVerticalTimelineView.tsx`
- `components/ui/ProjectModal.tsx`

수정안:

- 화면 문구를 `${project.title} 상세 보기`로 바꾸거나, 화면에는 `프로젝트 상세 보기`를 유지하고 `aria-label`에 프로젝트명을 포함한다.
- 카드 전체의 `role="button"`과 내부 링크가 중첩된 상호작용 구조를 재검토한다.
- 가능하면 카드 제목을 실제 상세 페이지 Link로 만들고 모달 열기는 별도 버튼으로 분리한다.

완료 조건:

- 링크 이름만 모아 읽어도 목적지를 구분할 수 있다.
- 카드, 모달, 상세 링크 사이에 키보드 이벤트 충돌이 없다.

### 2.3 대표 프로젝트 3선

대상 파일:

- `data/projects.json`
- `data/project-portfolio-sync.json`
- `components/sections/Projects.tsx`
- 필요 시 신규 `components/sections/FeaturedProjects.tsx`

표시 필드:

- 프로젝트와 해결한 문제
- 본인의 역할과 의사결정 범위
- 제약 조건
- 핵심 행동 또는 아키텍처 선택
- 측정 가능한 결과
- 공개 가능한 코드, 데모, 문서, 기사 링크

NDA 프로젝트는 수치를 범위나 비율로 익명화하고 검증할 수 없는 성과를 새로 만들지 않는다.

## Phase 3 — 접근성·시맨틱 구조·보안

예상 우선순위: P1  
예상 작업량: 1~2일

### 3.1 Activity Heatmap 재설계

대상 파일:

- `components/sections/ActivityHeatmap.tsx`

권장안:

- 시각 셀은 유지하되 모든 날짜를 기본 Tab stop으로 만들지 않는다.
- roving tabindex 또는 `aria-activedescendant` 기반 단일 키보드 진입점을 적용한다.
- 방향키로 날짜 이동, Enter/Space로 상세 선택을 지원한다.
- 모바일 터치 영역은 시각 셀보다 큰 최소 24×24px hit area를 제공한다.
- 전체 기간 요약과 선택 날짜 상세를 스크린리더가 먼저 읽을 수 있게 한다.

검증:

- 키보드만으로 진입, 이동, 선택, 이탈 가능
- VoiceOver에서 날짜와 커밋 수가 중복 없이 전달됨
- 200% 확대와 390px 화면에서 가로 잘림 없음

### 3.2 헤더 메뉴 ARIA

대상 파일:

- `components/layout/Header.tsx`

수정안:

- 토글 버튼에 `aria-expanded={isMobileMenuOpen}` 추가
- `aria-controls="mobile-navigation"` 추가
- 메뉴 컨테이너에 동일 id 부여
- 상태별 이름을 `메뉴 열기`/`메뉴 닫기`로 변경
- Escape 닫기와 메뉴 오픈 시 포커스 이동/복귀를 추가

### 3.3 제목 계층과 대비

대상 파일:

- `components/ui/ProjectTimelineView.tsx`
- `components/ui/ProjectVerticalTimelineView.tsx`
- `components/sections/Hero.tsx`
- `components/sections/ActivityHeatmap.tsx`

수정안:

- Projects의 H2 아래 프로젝트 제목을 H3로 통일한다.
- 카드 내부 보조 제목 H4는 실제 H3 하위일 때만 유지한다.
- hero tagline의 `text-neutral-500`을 우선 `text-neutral-400`으로 높이고 실제 계산 대비를 측정한다.
- 9~11px 레이블은 의미와 공간을 검토해 12px 이상으로 올린다.

완료 조건:

- 일반 텍스트 대비 4.5:1 이상
- Lighthouse Accessibility 95 이상
- heading outline에 H2→H4 점프 없음

### 3.4 보안 헤더 정리

대상 파일:

- `next.config.ts`

수정안:

- `poweredByHeader: false` 추가
- report-only CSP로 필요한 출처를 먼저 수집한 뒤 enforcement로 전환한다.
- Next.js inline script, Supabase, Google Analytics, 이미지 출처를 실제 사용 기준으로 허용한다.
- 오래된 `X-XSS-Protection`은 보안 효과를 기대하지 말고 CSP를 기준으로 관리한다.

주의:

- CSP를 추측해 바로 강제하면 hydration, GA, 관리자 기능이 깨질 수 있으므로 preview 배포에서 먼저 검증한다.

## Phase 4 — 구조화 데이터와 콘텐츠 신뢰도

예상 우선순위: P1/P2  
예상 작업량: 콘텐츠 준비에 따라 2~5일

### 4.1 Person 엔터티 통합

대상 파일:

- `lib/seo/profile.ts`
- `components/seo/JsonLd.tsx`
- `app/(site)/layout.tsx`
- `app/(site)/page.tsx`
- `app/(site)/projects/[slug]/page.tsx`
- `app/(site)/blog/[slug]/page.tsx`

수정안:

- Person에 `${siteUrl}/#person` 형태의 단일 `@id`를 부여한다.
- ProfilePage의 `mainEntity`, BlogPosting의 `author`, 프로젝트 스키마의 creator/author가 같은 `@id`를 참조하게 한다.
- `image`, `worksFor`, `alumniOf`, `dateModified`는 실제 공개 본문과 일치할 때만 추가한다.
- WebSite의 `/blog` 대상 ReadAction은 실제 의미가 없으면 제거한다.

완료 조건:

- 각 페이지 JSON-LD 파싱 성공
- Google Rich Results Test 및 Schema Markup Validator에서 오류 없음
- 서로 다른 Person 노드가 하나의 `@id`로 연결됨

### 4.2 프로젝트와 글의 증거 강화

대상 파일:

- `data/projects.json`
- 블로그 원문 저장소 또는 관리자 편집 데이터
- `app/(site)/projects/[slug]/page.tsx`
- `app/(site)/blog/[slug]/page.tsx`

수정안:

- 각 대표 프로젝트에 `문제 → 역할 → 판단 → 구현 → 결과 → 증거` 흐름을 적용한다.
- 공개 가능한 성능, 비용, 일정, 사용자 수, 팀 규모 지표를 추가한다.
- 기술 문서의 사실·수치 주장 옆에 공식 문서나 원 논문을 연결한다.
- 작성자 소개와 실제 수정일을 표시하고 JSON-LD와 일치시킨다.
- 한 글뿐인 태그는 합치거나 고유 설명을 추가한다. 가치가 낮으면 sitemap 제외와 noindex를 검토한다.

금지 사항:

- 검증되지 않은 수치, 가짜 후기, 가짜 최신 날짜를 추가하지 않는다.
- 모든 프로젝트에 동일한 SoftwareApplication 스키마를 기계적으로 적용하지 않는다.
- `llms.txt`는 선택 사항이며 이번 개선의 우선순위에 포함하지 않는다.

## 3. 테스트 계획

각 Phase마다 아래 순서를 수행한다.

```bash
npm run lint
npm run test:internal-sync
npm run build
```

preview 배포 후:

1. 모바일/데스크톱 Lighthouse를 각각 3회 실행해 중앙값을 기록한다.
2. sitemap의 모든 URL에 대해 상태 코드, canonical, robots, H1을 재검사한다.
3. 390×844, 768px, 1440×1100에서 시각 회귀를 확인한다.
4. 키보드와 VoiceOver로 Header, Activity, Projects, CTA를 점검한다.
5. JSON-LD를 파싱하고 Schema Validator로 검증한다.
6. CTA GA 이벤트와 이력서 다운로드 응답 헤더를 확인한다.

## 4. 배포 전략

변경을 한 번에 묶지 않고 다음 네 배포로 나눈다.

1. `perf/fonts-and-bundle`: 폰트 및 번들 최적화
2. `ux/recruiter-conversion`: CTA, 프로젝트 링크, 대표 프로젝트
3. `a11y/navigation-heatmap`: Activity, Header, heading, contrast
4. `seo/schema-and-evidence`: JSON-LD, 사례 증거, 블로그 인용

각 배포에서 Lighthouse와 64개 URL crawl 결과를 이전 배포와 비교한다. 성능 회귀나 indexability 변화가 있으면 해당 배포만 되돌릴 수 있게 유지한다.

## 5. 선행 결정

구현 전에 아래 두 항목만 확정하면 Phase 1~3을 막힘없이 진행할 수 있다.

1. 공개할 이력서 파일: `career.pdf` 또는 `portfolio.pdf`
2. 공개 연락 방식: 이메일 주소, 문의 폼, 또는 둘 다

그 외 항목은 현재 코드와 데이터만으로 순차 구현할 수 있다.
