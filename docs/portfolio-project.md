---
tags: [portfolio, project, nextjs, blog]
status: "운영 중"
period: "2026.02 ~ 현재"
company: "개인 프로젝트"
role: "포트폴리오·블로그 설계, 프론트엔드·서버 API 구현 및 운영"
tech: ["Next.js 16","React 19","TypeScript","Tailwind CSS 4","Supabase / PostgreSQL","Zod","react-markdown","Shiki","Mermaid","Vercel"]
created: "2026-09-08"
updated: "2026-09-08"
repo: portfolio
---

# ysk9926 Portfolio

> 프로젝트의 문제 해결 과정과 개발 지식을 한곳에서 보여주는 포트폴리오·기술 블로그. Next.js와 Supabase로 프로젝트 상세, Markdown 발행, 문서 동기화를 구현했습니다.

- 사이트: https://portfolio-pink-two-vymvu56oaw.vercel.app/
- 블로그: https://portfolio-pink-two-vymvu56oaw.vercel.app/blog
- 저장소: https://github.com/ysk9926/portfolio
- 기간: 2026.02 ~ 현재 (저장소 최초 커밋 2026-02-06 기준)

## 프로젝트 배경

### S · 상황

이력서와 종합 포트폴리오는 여러 프로젝트의 경력을 요약하는 문서여서, 사이트 자체에서 구현한 기능과 기술적 의사결정을 설명하기에는 한계가 있었습니다. 개발 경험을 더 깊게 전달하려면 프로젝트의 문제 해결 과정뿐 아니라 RAG·인프라·개발 도구에 관한 기술 글도 함께 탐색할 수 있어야 했습니다.

### T · 과제

제가 구현할 범위는 경력 소개에서 프로젝트 상세와 기술 글까지 이어지는 개인 웹사이트였습니다. 프로젝트에는 역할·문제·해결·결과와 화면 근거를 담고, 블로그에는 기술 글을 읽고 발행하는 기능을 구성했습니다. 문서와 개발 활동을 갱신할 수 있는 데이터 경로도 마련했습니다.

## 주요 구현과 문제 해결

### A · 행동

**1. 프로젝트를 문제 해결 과정으로 설명했습니다.** Next.js App Router로 소개 페이지와 개별 프로젝트 URL을 구성하고, 요약·역할·배경·해결·성과를 구조화했습니다. 상세 화면에는 스크린샷과 기술 스택, 배포·저장소 링크를 연결해 설명과 근거를 함께 볼 수 있게 했습니다.

**2. 기술 글을 직접 발행하는 블로그를 구현했습니다.** Supabase에 글·태그·댓글을 저장하고 공개 글만 목록과 상세에 노출했습니다. Markdown 본문에 Shiki 코드 하이라이팅, Mermaid 다이어그램, 제목 기반 목차와 예상 읽기 시간을 적용했습니다. 태그 탐색, 댓글·답글·좋아요를 구성하고 관리자 화면에서는 글 작성·수정과 초안/발행 상태를 관리하도록 했습니다.

**3. 프로젝트 문서와 사이트 데이터의 연결을 만들었습니다.** 섹션별 데이터 스키마를 Zod로 검증하고, 내부 동기화 API에서 프로젝트·문서 메타데이터·Git 활동을 PostgreSQL 트랜잭션으로 함께 반영하도록 구현했습니다. Git 활동은 회사·개인 프로젝트로 나누어 히트맵에 표시했습니다.

**4. 공유와 검색에 필요한 정보를 구성했습니다.** 프로젝트와 글마다 canonical·Open Graph·JSON-LD를 제공하고 Sitemap과 블로그 RSS를 구성했습니다. 데스크톱과 모바일에서 같은 프로젝트·글을 읽을 수 있도록 반응형 화면을 만들었습니다.

## 성과

### R · 결과

- 소개 → 프로젝트 상세 → 기술 블로그를 하나의 공개 사이트에서 탐색할 수 있는 결과물을 구축했습니다.
- 2026년 9월 8일 공개 데이터 기준 기술 글 **9편**을 발행했으며, 이 중 **RAG 시리즈 4편**에서 파이프라인·청킹/임베딩·Tool Calling·운영 경험을 정리했습니다.
- 프로젝트 경험은 STAR 상세와 스크린샷으로, 기술 지식은 태그와 목차를 갖춘 글로 전달할 수 있는 구조를 마련했습니다.
- 홈·블로그 목록·글 상세 및 모바일 글 화면에서 공개 서비스의 동작을 확인했습니다.

## 주요 기능

- STAR 기반 프로젝트 상세와 스크린샷 갤러리
- 태그별 기술 글 탐색과 Markdown 블로그
- 코드 하이라이팅·Mermaid·목차·예상 읽기 시간
- 관리자 글 작성·수정·초안/발행 관리
- 댓글·답글·좋아요
- Obsidian 프로젝트 문서와 Git 활동 동기화
- 프로젝트·블로그 메타데이터, Sitemap, RSS

## 스크린샷

### 홈 · 소개와 탐색

![홈 화면](https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com/images/projects/portfolio-20260908/01-home.png)

### 블로그 · 태그와 글 목록

![블로그 목록](https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com/images/projects/portfolio-20260908/02-blog.png)

### 기술 글 · 목차와 본문

![블로그 상세](https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com/images/projects/portfolio-20260908/03-blog-article.png)

### 모바일 · 기술 글 읽기

![모바일 블로그](https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com/images/projects/portfolio-20260908/04-blog-mobile.png)

## 근거와 확인 범위

확인일: 2026-09-08. 화면은 공개 배포 사이트, 구현은 로컬 저장소를 기준으로 대조했습니다. 과거 회고가 없는 부분은 현재 확인되는 요구와 구현 범위로 설명했습니다.

| 항목 | 근거 |
| --- | --- |
| S/T | 기존 00-포트폴리오-종합·00-포트폴리오-이력서 문서와 공개 홈의 중복 항목, 블로그 화면 |
| 프로젝트 상세 | app/(site)/projects/[slug]/page.tsx, lib/projects/portfolio.ts |
| 블로그 읽기 | app/(site)/blog/[slug]/page.tsx, components/blog/BlogMarkdown.tsx, lib/blog/server.ts |
| 관리자 발행 | app/api/admin/blog/posts/route.ts, app/admin/(protected)/blog |
| 문서 동기화 | lib/internal-sync/db.ts, lib/types/payload.ts, scripts/sync-git-activity.ts |
| 검색·공유 | app/sitemap.ts, app/(site)/blog/rss.xml/route.ts, 프로젝트·글 상세 metadata |
| R: 글 9편 / RAG 4편 | Supabase blog_posts의 status=published 조회. 방문수·조회수는 성과로 사용하지 않음 |
| 글 기획 | 02-Projects/notebooklm/active/포트폴리오 블로그.md의 Source: RAG 시리즈/00 - RAG 시리즈 인덱스.md |

블로그에서 설명하는 RAG 엔진은 다른 프로젝트의 경험을 정리한 콘텐츠입니다. 이 사이트 자체에 RAG 검색 엔진을 구현했다는 의미는 아닙니다. 관리자 기능은 소스 확인 기준이며, 이번 작업에서 글 발행·댓글 작성으로 운영 데이터를 시험하지 않았습니다.

## 통합 기록

- 기존 종합 항목 ID 1249036579를 유지하고 이력서 항목 ID 409417708을 목록에서 통합했습니다.
- 기존 경력 문서는 03-Personal/취업/포트폴리오 참고자료에 보관했습니다.
- 프로젝트 설명의 기준 문서는 이 파일입니다. 블로그 글 초안은 기존 active/포트폴리오 블로그 폴더에서 관리합니다.
