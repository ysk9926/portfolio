# 공개 포트폴리오 회사 프로젝트 익명화 설계

## 배경

현재 공개 포트폴리오 사이트는 Obsidian 원문이 아니라, 일일 sync 스크립트가 생성한 `projects`, `project-portfolio-sync`, `activity-heatmap` payload를 Supabase에 적재한 뒤 그 값을 렌더링한다.

따라서 공개 포트폴리오에서 회사 프로젝트명을 가리는 작업은 DB 값을 일회성으로 수정하는 방식이 아니라, **공개 payload 생성 규칙 자체에 익명화 로직을 넣는 방식**으로 처리해야 한다. 그래야 다음 자동 sync 이후에도 고객사명과 실프로젝트명이 다시 노출되지 않는다.

사용자 요구사항은 다음과 같다.

- Obsidian 원문과 내부 프로젝트 식별명은 유지한다.
- 공개 포트폴리오 기준으로만 회사 프로젝트명을 익명화한다.
- 새 프로젝트가 추가되어도 같은 규칙으로 자동 적용되도록 한다.
- 익명화 범위는 제목만이 아니라 공개 payload 전체에 적용한다.

## 목표

- 공개 사이트에 노출되는 회사 프로젝트명, 고객사명, 고객사 식별이 가능한 제목 표현을 제거한다.
- 익명화된 공개 제목과 설명이 `projects`, `project-portfolio-sync`, `activity-heatmap` 전반에서 일관되게 유지되도록 한다.
- 개인 프로젝트와 이미 공개해도 되는 개인 서비스명은 기존처럼 유지한다.
- 수동 후처리 없이 일일 sync만으로 같은 결과가 재생산되도록 한다.

## 비목표

- Obsidian 문서 파일명, 문서 제목, 프로젝트 인덱스, active/archive 노트 구조 변경
- repo 매핑 방식 자체 변경
- 포트폴리오 admin UI에서 수동으로 개별 프로젝트를 편집하는 운영 방식 도입
- 회사 프로젝트의 기술 스택, 역할, 기간까지 숨기는 것

## 익명화 대상

익명화 대상은 `track == "회사"`로 공개되는 프로젝트다.

다음 데이터에 동일 규칙을 적용한다.

- `projects.title`
- `projects.description`
- `projects.shortDescription`
- `projects.star.summary`
- `project-portfolio-sync.projects[].projectTitle`
- `project-portfolio-sync.projects[].headline`
- `project-portfolio-sync.projects[].summary`
- `project-portfolio-sync.projects[].company`
- `activity-heatmap.weeks[].days[].companyProjects[].name`

다음 항목은 그대로 둔다.

- `period`
- `role`
- `teamSize`
- `tech`, `techStack`
- `track`
- 스크린샷 경로와 이미지 자산
- GitHub/배포 링크가 있는 개인 프로젝트 데이터

## 공개 익명화 규칙

### 1. 트랙 기준

- `개인` 프로젝트는 익명화하지 않는다.
- `회사` 프로젝트만 익명화한다.

### 2. 제목 규칙

공개 제목은 **도메인 설명형 제목**으로 치환한다.

원칙:

- 고객사명, 브랜드명, 법인명, 내부 코드명, 제품 실명을 제거한다.
- 프로젝트 역할과 업종/도메인만 남긴다.
- 같은 내부 프로젝트는 매 sync 시 항상 같은 공개 제목으로 생성한다.

예시 방향:

- `법무법인 마중` → `법률 AI 플랫폼`
- `더맛있는하루 ERP` → `식품 유통 ERP`
- `제스프로 ERP` → `제조 운영 ERP`
- `메가프레스 ERP` → `인쇄 제조 ERP`
- `아울 소사이어티` → `구독 커머스 플랫폼`
- `Poooling 내부 도구 & 프로젝트 관리 시스템` → `사내 개발 생산성 플랫폼`

### 3. 설명 규칙

공개 설명은 다음 기준을 따른다.

- 제목과 마찬가지로 고객사 식별어를 제거한다.
- 도메인, 문제 유형, 기능군, 사용자 가치 중심으로 서술한다.
- 고객사명을 포함한 기존 본문 요약을 그대로 사용하지 않는다.

예시:

- `법률 AI 플랫폼으로, 법령·판례 검색과 문서 자동화를 지원하는 RAG 기반 업무 시스템 개발 작업입니다.`
- `제조 운영 ERP로, 발주·재고·정산·운영 프로세스를 통합 관리하기 위한 업무 시스템 고도화 작업입니다.`

### 4. company 표시 규칙

공개 포트폴리오의 `company` 뱃지는 실제 회사명이나 고객사를 뜻하는 표현으로 쓰지 않는다.

권장 표준값:

- 개인 프로젝트: 기존 값 유지 (`개인 프로젝트`)
- 회사 프로젝트: `B2B/사내 프로젝트`

이 값은 공개 포트폴리오에서만 사용한다.

### 5. heatmap 규칙

Activity heatmap의 회사 프로젝트명도 같은 공개 제목으로 치환한다.

즉, 하루 활동 목록에 `법무법인 마중`, `제스프로`, `Poooling 내부 도구...`가 직접 노출되면 안 되고, 같은 규칙의 익명화 제목으로 나와야 한다.

### 6. override 우선 규칙

자동 분류만으로는 제목이 겹치거나 지나치게 일반적일 수 있으므로, 공개용 익명화는 다음 우선순위를 따른다.

1. 명시적 공개 제목 override
2. 프로젝트 분류기 기반 기본 공개 제목
3. 최후 fallback 일반 제목

fallback 예시:

- `업무 운영 플랫폼`
- `기업용 웹 플랫폼`

## 구현 구조

### A. sync 스크립트에 공개 익명화 프로필 레이어 추가

대상 파일:

- `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py`

새 책임:

- 내부 프로젝트 정보(`ProjectDoc`, repo 매핑, Obsidian 원문)는 그대로 유지
- 공개 payload 생성 직전에 `공개용 익명화 프로필`을 계산
- 동일 프로필을 `projects`, `project-portfolio-sync`, `activity-heatmap`에 재사용

권장 함수 구조:

- `infer_public_project_profile(project: ProjectDoc) -> dict[str, Any]`
  - 기존 분류기(`is_legal_ai_project`, `is_commerce_platform_project`, `is_erp_project`)를 재사용
  - 공개 제목, 공개 요약, 공개 company 값을 반환
- `get_public_project_title(project_name: str, track: str, project: ProjectDoc) -> str`
- `get_public_project_summary(project: ProjectDoc, track: str) -> str`
- `get_public_company_label(track: str) -> str`

### B. 명시적 익명화 override 맵 도입

스크립트 상수로 `PUBLIC_PROJECT_OVERRIDES`를 추가한다.

형태 예시:

```python
PUBLIC_PROJECT_OVERRIDES = {
    "법무법인 마중": {
        "title": "법률 AI 플랫폼",
        "summary": "법령·판례 검색과 문서 자동화를 지원하는 RAG 기반 업무 시스템 개발 작업입니다.",
    },
    "더맛있는하루": {
        "title": "식품 유통 ERP",
        "summary": "발주·출고·정산·운영 프로세스를 통합 관리하기 위한 ERP 구축·고도화 작업입니다.",
    },
}
```

이 override는 `track == "회사"`일 때만 적용한다.

### C. `projects` payload 반영

현재 `build_generated_projects_payload()`는 frontmatter title 또는 문서 heading을 기반으로 `project_payload["title"]`을 만든다.

이 로직을 다음처럼 변경한다.

- 개인 프로젝트: 기존 title 사용
- 회사 프로젝트: 공개 익명화 title 사용
- `description`, `shortDescription`, `star.summary`도 공개 익명화 summary로 교체

단, `star.background`, `star.solutions`, `star.results`는 Obsidian 포트폴리오 문서의 내용을 그대로 노출하므로, 회사 프로젝트에 대해서는 다음 중 하나로 제한한다.

권장안:

- 회사 프로젝트에서 `star.background/solutions/results/troubleshooting`은 포트폴리오 문서 원문 대신 공개용 자동 요약으로 대체
- 개인 프로젝트는 기존 문서 기반 상세 서술 유지

이렇게 해야 문서 본문 안에 남아 있는 고객사명이 모달 상세에서 다시 노출되지 않는다.

### D. `project-portfolio-sync` payload 반영

현재 `build_portfolio_project_sync_payload()`는 frontmatter와 heading을 그대로 사용한다.

변경 규칙:

- `projectTitle` → 공개 익명화 title
- `headline` → 공개 익명화 title
- `summary` → 공개 익명화 summary
- `company` → `B2B/사내 프로젝트`

`role`, `period`, `teamSize`, `tech`, `track`는 유지한다.

### E. `activity-heatmap` payload 반영

현재 heatmap은 `context.repo_project_map`에서 얻은 내부 프로젝트명을 그대로 `companyProjects`에 넣는다.

변경 규칙:

- `회사` 트랙 프로젝트명은 공개 익명화 title로 치환
- `개인` 트랙은 기존 값 유지

구현상 `serialize_project_counter()` 전에 이름을 치환하거나, counter 자체를 공개용 이름으로 집계해도 된다.

권장안:

- commit 집계 단계에서 공개용 이름으로 bucket에 적재

이유:

- 같은 회사 프로젝트가 여러 repo로 분산된 경우에도 공개 제목 단위로 자연스럽게 합산됨

## UI 영향

포트폴리오 UI 코드 자체는 큰 구조 변경이 필요 없다.

영향 받는 컴포넌트:

- `ProjectCard`
- `ProjectModal`
- `ProjectTimelineView`
- `ProjectVerticalTimelineView`
- `ActivityHeatmap`

이 컴포넌트들은 이미 payload의 `title`, `status`, `summary`, `companyProjects[].name`을 표시하므로, sync 단계에서 공개용 값을 일관되게 생성하면 UI 수정 없이 대부분 반영된다.

예외:

- `ProjectModal`에서 회사 프로젝트의 `star.*` 세부 본문이 고객사명을 다시 노출할 수 있으므로, payload 생성 단계에서 차단이 필요하다.

## 검증 기준

### 데이터 검증

sync 실행 후 다음이 성립해야 한다.

- `projects`에 회사 프로젝트 실명이 남지 않는다.
- `project-portfolio-sync`에 회사 프로젝트 `projectTitle/headline/summary/company` 실명이 남지 않는다.
- `activity-heatmap`의 `companyProjects[].name`에 회사 프로젝트 실명이 남지 않는다.
- 개인 프로젝트(`MyDate`, `Doc Creator` 등)는 기존 제목이 유지된다.

### UI 검증

공개 포트폴리오 홈에서 다음이 성립해야 한다.

- 카드 제목이 익명화 제목으로 보인다.
- 모달 제목과 상태/회사 뱃지가 익명화 결과를 따른다.
- vertical timeline, gantt timeline 모두 같은 제목을 쓴다.
- activity heatmap hover/목록에 회사 실명이 남지 않는다.

### 회귀 검증

- 기존 screenshot 동기화는 깨지지 않는다.
- repo 매핑과 unmatched repo 목록은 기존과 동일하게 동작한다.
- 개인 프로젝트명은 의도치 않게 익명화되지 않는다.
- `MyDate`처럼 공개 서비스명은 유지된다.

## 테스트 전략

### Python 단위 테스트

대상:

- `tests/test_project_registry_sync_portfolio.py`

추가할 테스트:

- 회사 프로젝트 profile이 공개 익명화 title/summary/company로 변환되는지
- 개인 프로젝트는 기존 title/summary를 유지하는지
- `build_generated_projects_payload()`가 회사 프로젝트에 익명화 title을 쓰는지
- `build_portfolio_project_sync_payload()`가 회사 프로젝트에 익명화 title/headline/company를 쓰는지
- `build_activity_heatmap_payload()`가 회사 프로젝트명을 익명화해서 넣는지
- 회사 프로젝트 모달용 `star` payload가 원문 고객사명을 다시 노출하지 않는지

### 통합 검증

수동 절차:

1. sync 스크립트 실행
2. bootstrap API로 `projects`, `project-portfolio-sync`, `activity-heatmap` 확인
3. 공개 사이트에서 카드/타임라인/모달/heatmap 확인

## 롤아웃 순서

1. 익명화 규칙 상수와 helper 함수 추가
2. `projects` payload 익명화 반영
3. `project-portfolio-sync` payload 익명화 반영
4. `activity-heatmap` 익명화 반영
5. 테스트 추가
6. sync 실행 및 사이트 검증

## 결정 사항

- 공개 포트폴리오 기준으로만 익명화한다.
- 익명화 방식은 도메인 설명형 제목을 사용한다.
- 익명화 범위는 제목만이 아니라 공개 payload 전체다.
- DB를 직접 수정하는 방식이 아니라 sync 생성 규칙을 변경한다.
