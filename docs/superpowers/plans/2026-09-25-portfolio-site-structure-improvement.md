# 포트폴리오 사이트 구조 개선 실행 계획

> 기준: 2026-09-25 사용자 제공 종합 진단 및 개선 방향. 이 문서는 구현 전 계획이며 현재 공개 사이트에 변경을 적용하지 않는다.

**목표:** 첫 방문자가 대표 직무와 근거 프로젝트를 빠르게 이해하고, 경력·기술·AI 작업 방식·기록을 필요에 따라 더 깊게 탐색할 수 있게 한다.

**설계 방향:** 기존 단일 홈의 섹션과 프로젝트 상세 URL, 자체 블로그를 유지한다. 홈과 내비게이션의 순서를 채용 검토 흐름에 맞추고, Projects에는 직무 연관성이 높은 대표 사례를 별도로 보여준다. 기술과 AI의 세부 목록은 요약 아래로 내린다.

**기술 범위:** Next.js 16 App Router, React 19, TypeScript, Supabase 섹션 페이로드, 기존 분석 이벤트.

**참고 설계:** [기존 AI Workflow 섹션 설계](../specs/2026-09-08-ai-workflow-section-design.md). 당시의 AI 우선 배치 결정은 이번 사용자 요청으로 갱신한다.

## 1. 최종 정보 구조

### 상단 메뉴

`About · Projects · Career · Skills · AI Workflow · Archive`

모두 홈의 앵커로 연결한다. `Archive`는 별도 페이지를 새로 만들지 않고 홈 하단의 통합 섹션으로 둔다. 현재 별도 URL인 `/blog`와 글 상세는 유지하며, Archive 안의 명확한 `Blog` 링크, 프로젝트 상세의 관련 글 링크, 필요한 곳의 푸터 링크로 접근하게 한다. 블로그를 상단 메뉴에서 내리는 결정은 검색 유입과 기존 URL을 바꾸지 않는다.

### 홈 섹션 순서

`Hero → About → Projects → Career → Skills → AI Workflow → Archive`

`Activity` 히트맵은 Archive 안의 하위 블록으로 이동한다. 각 앵커 ID(`about`, `projects`, `career`, `skills`, `ai-workflow`, `archiving`)와 `/blog`, `/projects/[slug]` 경로는 유지한다. `#activity`가 현재 사용되는 외부 링크일 수 있으므로 히트맵 요소의 ID도 보존한다.

### 각 섹션이 답할 질문

| 위치 | 첫 화면에서 답할 질문 | 아래에서 제공할 근거 |
| --- | --- | --- |
| Hero | 어떤 개발자인가? | 검증된 기간·프로젝트 수, 대표 프로젝트로 이동 |
| About | 어떤 방식으로 문제를 맡는가? | 역할·작업 범위·연락처 |
| Projects | 채용 직무와 맞는 결과물은? | 관리자에서 고른 대표 3건, 전체 목록·시간순 보기·상세 모달·상세 URL |
| Career | 어디서 어떤 책임을 졌는가? | 회사별 기간·역할·성과 |
| Skills | 지금 주력으로 쓰는 스택은? | Core Stack 먼저, 사용 경험과 프로젝트 근거는 아래 |
| AI Workflow | AI를 어떻게 업무에 적용하는가? | 작업 순서·검증 방법·대표 자동화 3건, 도구·스킬 전체 목록은 아래 |
| Archive | 더 확인할 기록은? | Blog·GitHub·App Store 등 링크, Activity 히트맵 |

## 2. 콘텐츠 규칙

### 대표 메시지

히어로의 주 문장은 `Enterprise 시스템을 설계하고, AI로 개발 프로세스를 개선하는 풀스택 개발자`로 한다. 보조 문장은 `2025년 5월부터 기업용 업무 시스템과 AI 프로젝트를 기획부터 운영까지 이끌고 있습니다.`로 한다. About과 AI Workflow에서는 같은 문장을 장문으로 반복하기보다 각각 `시스템 설계·운영`과 `AI를 사용한 작업 방식`이라는 역할별 요약으로 연결한다. 동일한 주장이 서로 다른 수치나 의미로 쓰이지 않도록 하나의 편집 기준을 둔다.

운영 데이터를 확인한 결과 경력은 2025년 5월 시작이며 프로젝트 레코드는 23건이다. 제목이 같은 별도 항목도 있으므로 과거 문구의 `11개월·14개`는 현재 대표 메시지에서 제외한다. `Enterprise`는 채용 문맥에 따라 `기업용 업무 시스템`으로 바꿀 수 있지만, 어느 표현을 고르든 메타 설명과 OG 문구에 같은 정체성을 반영한다.

### 섹션 중복 해소

- About에는 사람·업무 방식·작업 범위를, Career에는 회사별 이력과 성과를 둔다. 동일 성과 서술은 Career에 한 번만 상세히 쓴다.
- Skills에는 제품 개발 스택과 프로젝트 근거를, AI Workflow에는 AI 도구를 사용하는 절차와 검증·자동화 사례를 둔다.
- Archive의 GitHub 카드는 저장소로 가는 경로, Activity 히트맵은 시기별 활동 근거로 역할을 나눈다. 커밋 수치를 두 곳에서 반복해 강조하지 않는다.
- Blog는 원문이 있는 자체 사이트로 유지하고, Archive에서는 소개와 링크만 제공한다.

## 3. 단계별 작업

### 1단계 — 메시지와 탐색 구조 (최우선)

**대상:** `app/(site)/page.tsx`, `app/(site)/layout.tsx`, `components/sections/Hero.tsx`, `components/layout/Header.tsx`, `app/opengraph-image.tsx`, `components/seo/JsonLd.tsx`, 운영 DB의 `site` 섹션.

1. 운영 `site` 페이로드의 현재 `hero`, `nav`, `aboutSummary`를 읽어 백업하고 공개 프로젝트·경력 건수와 기간을 확인한다. DB 값이 화면 문구의 원본이며 코드에는 오래된 내비를 보정하는 로직이 따로 있다.
2. 히어로를 정체성 한 문장, 검증된 근거 한 문장, `대표 프로젝트 보기` 주 행동, 이력서·연락처 보조 행동 순으로 편집한다. 현재 AI 스킬 수 하이라이트는 AI Workflow 요약으로 옮긴다.
3. 홈 섹션을 위의 최종 순서로 재배치하고, 저장된 내비와 `withDefaultNav` 보정 로직이 충돌하지 않게 단일 메뉴 구성을 정한다. 데스크톱·모바일 메뉴에서 같은 순서와 라벨을 사용한다.
4. 홈 메타 설명, OG 이미지, JSON-LD의 직무 표현을 새 메시지에 맞춘다. 기존 URL과 canonical은 유지한다.

**완료 기준:** 데스크톱·모바일에서 메뉴 6개가 정확한 섹션으로 이동한다. 블로그 상세나 프로젝트 상세에서 앵커를 누르면 홈의 해당 섹션으로 돌아간다. 히어로에서 직무와 근거를 스크롤 없이 읽을 수 있다.

### 2단계 — 대표 프로젝트와 요약 계층

**대상:** `components/sections/Projects.tsx`, `components/ui/ProjectVerticalTimelineView.tsx`, `components/sections/Skills.tsx`, `components/sections/AiWorkflow.tsx`, `components/ai/*`, `components/admin/AdminSectionEditor.tsx`, `components/admin/AdminShell.tsx`, `components/admin/editors/FeaturedProjectsEditor.tsx`(신규), `lib/types/payload.ts`, `lib/types/view.ts`, `lib/portfolio-data/server.ts`, `lib/projects/portfolio.ts`, `app/api/admin/sections/[sectionKey]/route.ts`, 신규 Supabase 마이그레이션, 운영 DB의 `projects`, `featured-projects`, `skills`, `ai-workflow` 섹션.

1. 관리자 콘텐츠 메뉴에 `대표 프로젝트`를 추가한다. `FeaturedProjectsEditor`는 현재 `projects` 섹션의 **전체 프로젝트**를 선택지로 불러오고, 세 개의 선택 칸에 1·2·3순위로 배치한다. 같은 프로젝트의 중복 선택을 막고 선택 칸의 순서를 바꿀 수 있게 한다. 프로젝트 제목과 ID를 함께 보여줘 이름이 유사한 항목도 구별한다.
2. 선택 결과는 프로젝트별 플래그가 아닌 독립 `featured-projects` 섹션의 `{ "ids": [첫째ID, 둘째ID, 셋째ID] }` 형태로 저장한다. 새 섹션을 `sectionKeys`, Zod 스키마, `RAW_JSON_SECTIONS`에 등록하고 `section_payloads`의 키 제약을 확장하는 마이그레이션을 추가한다. 마이그레이션은 초기값 `{ "ids": [] }`를 만든다. 빈 배열은 아직 대표 프로젝트를 설정하지 않은 상태로 허용하고, 그 외에는 서로 다른 ID 정확히 3개만 허용한다.
3. 관리자 저장 API는 세 ID가 **저장 시점의 전체 프로젝트에 모두 존재하는지** 확인한다. 저장 후 홈 경로를 재검증한다. 프로젝트 데이터의 관리자 저장과 내부 동기화는 `projects` 행을 삭제·재삽입하므로 대표 설정을 `projects` 행의 컬럼이나 외래키가 있는 별도 테이블에 두지 않는다. 프로젝트가 나중에 삭제되면 공개 화면에서는 사라진 ID를 건너뛰고, 관리자 화면에는 재선택이 필요하다고 표시한다.
4. 운영 프로젝트에서 `B2B 수출입 커머스 운영 플랫폼`, `금융·세무 연동 API 플랫폼`, `RAG 기반 AI 프로젝트`에 해당하는 실제 프로젝트 ID와 공개 제목을 확인한 뒤, 관리자 페이지에서 그 세 건을 추천 순서대로 선택한다. 이 셋은 초기 편집 권장안이며 코드에 고정하지 않는다. 이름이 다르거나 여러 건에 해당하면 공개 상세와 직무 연관성을 기준으로 선택한다.
5. Projects 첫 블록에는 저장된 ID 순서대로 대표 프로젝트를 노출한다. 아래에 `전체 프로젝트`를 두고 기존 카드·세로 타임라인·간트 타임라인 및 모달·상세 URL을 유지한다. 대표 프로젝트도 전체 목록에 남긴다. 설정이 비어 있으면 대표 블록을 숨기고 전체 목록을 바로 보여준다. 현재 기본값인 세로 타임라인은 날짜순으로 다시 정렬하므로, 페이로드 배열 순서 변경에 의존하지 않는다.
6. Skills 첫 블록을 `Core Stack`으로 구성한다. 후보는 TypeScript·React·Next.js·Kotlin·Spring Boot·PostgreSQL·Docker·AWS다. 각 항목의 프로젝트 사용 근거를 대조하고 실제 주력 스택만 남긴다. `Also Worked With`에는 그 밖의 확인된 사용 경험을 둔다. 기존 기술별 `detail` 근거는 하단에서 볼 수 있게 유지한다.
7. AI Workflow 첫 블록에는 한 문장 요약, 기존 5단계 작업 흐름, 대표 자동화 사례 3건을 배치한다. 후보 사례는 실제 페이로드의 `commands` 및 프로젝트 근거에서 고른다. `stats`, 도구 카드, 스킬 그룹, 전체 커맨드 목록은 하단 상세로 이동한다. `38개`·`21개` 등의 숫자는 페이로드와 현행 근거를 재확인하고, 시간에 따라 변하는 수치로 표기한다.

**완료 기준:** 관리자에서 전체 프로젝트 중 서로 다른 3건을 선택·재정렬·저장하면, 새로고침 후에도 선택이 유지되고 홈 Projects 첫 블록에 같은 순서로 나타난다. 존재하지 않는 ID 또는 중복 ID는 저장할 수 없다. 전체 타임라인과 상세 페이지에는 모든 프로젝트가 계속 표시된다. Skills와 AI Workflow는 첫 화면만 읽어도 핵심이 이해되고, 기존 세부 정보에는 계속 접근할 수 있다. 미확인 기술·성과·도구 수는 노출하지 않는다.

### 3단계 — Archive 통합과 프로젝트·글 연결

**대상:** `components/sections/Archiving.tsx`, `components/sections/ActivityHeatmap.tsx`, `app/(site)/page.tsx`, `app/(site)/projects/[slug]/page.tsx`, `app/(site)/blog/[slug]/page.tsx`, 블로그 글과 프로젝트의 연결 데이터.

1. Archive에 Blog·GitHub·App Store 등 실제 운영 중인 채널을 목적별 링크로 제시하고, Activity 히트맵을 하위 블록으로 둔다. 현재 `ActivityHeatmap`은 자체 `SectionWrapper`를 가지므로 내용과 섹션 래퍼를 분리해 Archive 안에 이중 제목·과도한 여백이 생기지 않게 한다. 히트맵 콘텐츠의 `#activity` 대상은 유지한다. 링크가 없는 채널은 빈 카드로 만들지 않는다.
2. 프로젝트와 글의 연결은 `project.id`와 게시된 글의 `slug`로 명시적으로 관리한다. 제목 유사도나 태그만으로 자동 연결하지 않는다. 운영 중인 RAG 글과 RAG 프로젝트부터 실제 관련성을 검토해 연결하고, 연결이 없는 상세 페이지는 관련 섹션 자체를 숨긴다.
3. 프로젝트 상세에는 `관련 기술 글`, 글 상세에는 `관련 프로젝트`를 서로 연결한다. 링크 대상이 공개 상태인지 확인하고, 본문 속 기존 인라인 링크와 중복되면 한쪽만 보여준다.
4. About과 Career의 중복 문장을 정리한다. About의 짧은 소개에서 Career로 이동하는 링크를 제공한다.

**완료 기준:** 대표 프로젝트에서 관련 글로, 그 글에서 다시 프로젝트로 이동할 수 있다. Archive에서 블로그와 GitHub를 찾을 수 있다. 기존 글·프로젝트 URL과 `#activity` 앵커가 동작한다.

### 4단계 — 검색·운영 점검과 선택적 배포 채널

**대상:** `app/(site)/layout.tsx`, `app/(site)/blog/page.tsx`, `app/(site)/blog/[slug]/page.tsx`, `app/(site)/projects/[slug]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `docs/seo/*`.

1. 이미 있는 홈·블로그·프로젝트 canonical과 sitemap을 실제 출력에서 확인한다. 새 메뉴 구조 때문에 URL을 추가하지 않았으므로 sitemap 신규 항목은 원칙적으로 없다.
2. 메타 제목·설명·OG 문구가 새 대표 메시지와 충돌하지 않는지 점검한다. 프로젝트↔글 링크의 상태 코드와 공개 범위를 확인한다.
3. Velog 병행은 별도 운영 결정으로 남긴다. 병행할 경우 자체 블로그를 원문으로 먼저 게시하고 Velog에는 요약과 원문 링크를 싣는다. 외부 플랫폼의 canonical 설정 가능 여부는 실제 발행 시 확인한다.

**완료 기준:** 대표 경로 `/`, `/blog`, 연결된 `/blog/[slug]`, `/projects/[slug]`의 canonical·OG·sitemap 출력이 맞고 내부 링크에 404가 없다.

## 4. 검증과 측정

- 변경 전 분석 데이터에서 홈 `projects` 섹션 도달, 프로젝트 상세 진입, 블로그 이동, 이력서 다운로드를 기준선으로 기록한다. 기존 분석 이벤트의 섹션 ID와 타깃명을 유지해 변경 전후를 비교한다.
- 구현 후 `npm run lint`, `npm test`, `npm run build`를 실행한다. 새로 필요한 테스트는 대표 프로젝트 ID의 중복·누락·순서·삭제 후 표시 규칙, 공개 글만 연결하는 규칙, 메뉴 앵커처럼 회귀 위험이 있는 동작에 한정한다.
- 수동으로 데스크톱·모바일 첫 화면, 상단·모바일 메뉴, 세 가지 프로젝트 뷰, 프로젝트 모달·상세, 프로젝트↔블로그 왕복, Archive의 외부 링크와 키보드 탐색을 확인한다.
- 변경 후 2~4주 동안 같은 분석 지표를 비교한다. 세션 구성과 유입 경로 변화가 있으므로 단순 증가를 구조 개선의 효과로 단정하지 않는다.

## 5. 의존성과 게시 순서

1단계의 운영 데이터 확인과 문구 확정이 먼저다. 2단계에서는 새 `featured-projects` 키를 허용하는 DB 마이그레이션을 적용한 뒤 코드와 관리자 편집기를 배포하고, 그다음 실제 프로젝트 3건을 관리자에서 선택한다. 프로젝트 자동 동기화 후에도 이 선택이 유지되는지 확인한다. 실제 기술 근거도 게시 전에 확정한다. 3단계의 양방향 링크는 글이 공개된 후에만 노출한다. 각 단계는 별도 배포 가능한 크기로 나누고, 운영 DB의 `site`·`projects`·`featured-projects`·`skills`·`ai-workflow` 페이로드는 백업 후 변경한다. 현재 사이트가 DB 페이로드를 읽으므로 코드만 배포하면 문구·메뉴의 일부가 이전 상태로 남을 수 있다.

이번 계획은 콘텐츠 삭제나 URL 이전을 전제로 하지 않는다. 기존 상세 모달, 기술 근거, AI 작업 기록, 자체 블로그는 유지하면서 첫 노출 순서와 콘텐츠 역할을 조정한다.
