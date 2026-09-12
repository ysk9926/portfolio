# data/*.json 레이어 제거 — DB 단일 소스 전환 계획

Date: 2026-09-12
Status: 실행 완료 (2026-09-12)

## 배경

`data/*.json`은 현재 **사이트를 구동하지 않는다.** 런타임 읽기는 이미 전부
Supabase를 거친다 (`lib/portfolio-data/server.ts:56-73`, `export_section_payload`).

그럼에도 파일이 남아 있어 **stale한 3중 스냅샷** 상태다:

| 레이어 | 역할 | 상태 |
|---|---|---|
| Obsidian 원문 | 진짜 소스 | 정상 |
| Supabase DB | 운영 사본 (projects 23개) | 정상 |
| `data/*.json` | 아무도 안 읽는 스냅샷 (projects 9개) | **stale** |

### 실제 위험 (가설 아님, 이번 세션에서 발생)

`npm run supabase:seed`가 살아 있어서, 이 stale 파일로 DB를 덮어쓸 수 있다.
실행됐다면 DB 23개가 9개로 교체되고 관리자 편집분이 전부 소실된다.
ID조차 불일치한다 (DB `118115763` vs JSON `7`).

**따라서 이 작업의 1차 목적은 정리가 아니라 사고 방지다.**

## 목표

- `data/*.json`을 소스로 취급하는 경로를 전부 제거한다.
- DB를 단일 소스로 확정한다.
- 파괴적 seed 경로를 제거한다.

## 비목표

- 익명화 정책 변경 (별건, `project_registry_sync.py` 소관)
- 스키마 변경 — `sectionPayloadSchemaMap`은 그대로 둔다
- 이미지 자산 이전 — `public/images/**`는 계속 파일 기반
- 관리자 UI 편집 흐름 변경

## 현황 조사 결과

### 런타임 의존 — 1건

- `lib/portfolio-data/server.ts:21` — `ai-workflow.json` 폴백 (유일)

`data/projects.json`을 읽는 런타임 코드는 **없다.**

### 테스트 의존 — 1건

- `tests/project-images.test.ts:4-5` — `projects.json` + `project-portfolio-sync.json` import

### 외부 스크립트 의존 — 1건 (중요)

- `project_registry_sync.py:3277-3282` `load_local_bootstrap_payloads()`
  REST 도달 불가 시 JSON을 **fallback bootstrap**으로 읽는다.
  → 대체재는 이미 존재: `GET /api/internal/sync/portfolio`
    (`app/api/internal/sync/portfolio/route.ts:15`, `exportPortfolioBootstrap`)

### 파괴적 경로 — 2건

- `scripts/supabase/seed-from-json.ts` — JSON → DB 덮어쓰기
- `scripts/supabase/verify-roundtrip.ts` — JSON 기준으로 DB 비교

### 섹션별 쓰기 경로

| 섹션 | 쓰기 주체 | JSON 필요성 |
|---|---|---|
| projects / project-portfolio-sync / activity-heatmap | sync 스크립트 (REST) | 불필요 |
| site / about / skills / archiving / career | 관리자 UI | 불필요 |
| ai-workflow | 관리자 UI (JSON 모드) | **폴백으로 사용 중** |

## 실행 계획

### Phase 0 — 안전망 (선행 필수)

1. DB 전체 스냅샷을 `backup/`에 덤프 (9개 섹션, git 미추적)
2. 스냅샷이 현재 사이트 내용과 일치하는지 확인

근거: 이후 단계는 되돌리기 어렵다. 백업 없이 진행하지 않는다.

### Phase 1 — 파괴적 경로 제거

1. `scripts/supabase/seed-from-json.ts` 삭제
2. `package.json`에서 `supabase:seed` 제거
3. `verify-roundtrip.ts` 삭제 + `supabase:verify` 제거
   (JSON 기준 비교라 JSON 제거 후 의미 없음)

이 단계만으로 사고 위험이 사라진다. **가장 가치 높은 단계.**

### Phase 2 — ai-workflow 폴백 해소

**확인 완료 (2026-09-12): `ai-workflow` 행이 DB에 이미 존재한다.**
9개 섹션 전부 `section_payloads`에 있다. 주입 단계는 불필요하다.

1. `server.ts:21`의 `aiWorkflowFallback` import 제거
2. `RAW_SECTION_FALLBACKS` 상수 제거 (`server.ts:29-31`)
3. `getRawSectionPayload`의 `?? RAW_SECTION_FALLBACKS[sectionKey]` 제거 (`server.ts:44`)

### Phase 3 — 외부 스크립트 전환

`project_registry_sync.py` 수정 (이 repo 밖):

1. `load_local_bootstrap_payloads()`를 `GET /api/internal/sync/portfolio` 호출로 교체
2. REST 실패 시 JSON 폴백 대신 **명시적 실패** — stale 데이터로 조용히 진행하는 것이
   이번 사고의 근본 원인이었다
3. 드라이런으로 검증

### Phase 4 — 테스트 전환

`tests/project-images.test.ts`를 `tests/fixtures/`의 고정 픽스처 기반으로 변경.
이미지 URL 변환 로직 검증이 목적이므로 실데이터일 필요가 없다.

### Phase 5 — 파일 제거

1. `data/*.json` 9개 삭제 (Phase 1–4 완료 후)
2. `.claude/commands/add-project.md`를 DB/관리자 UI 기준으로 갱신
   (현재 `data/projects.json` 직접 편집을 지시 — 방치 시 stale 파일이 되살아남)

## 검증

각 Phase 후:
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- 사이트 주요 경로 육안 확인 (`/`, `/projects/[slug]`, `/admin`)

최종: 프로젝트 23개가 그대로 보이는지, 상세 모달이 정상인지 확인.

## 롤백

Phase 5 전까지는 `git revert`로 복구된다.
Phase 5 이후 데이터 복구는 Phase 0 백업에 의존한다.

## 열린 질문

1. **Phase 3는 이 repo 밖**이다. Obsidian 스크립트도 함께 진행할지?
   Phase 1–2만 해도 사고 위험은 제거된다.
2. `data/`를 삭제할지, `seed/legacy/`로 이동해 이력만 남길지?
3. 진행 순서 — Phase 1만 먼저 하고 나머지는 나중에 해도 무방하다.


---

## 실행 결과 (2026-09-12)

| Phase | 상태 | 비고 |
|---|---|---|
| 0 백업 | 완료 | `backup/db-snapshot-*.json` (9섹션, projects 23) — gitignore |
| 1 파괴적 경로 제거 | 완료 | `seed-from-json.ts`, `verify-roundtrip.ts` + npm 스크립트 |
| 2 ai-workflow 폴백 | 완료 | DB 행 확인 후 제거, 누락 시 명시적 예외 |
| 3 Obsidian 스크립트 | 완료 | 아래 미검증 항목 참고 |
| 4 테스트 픽스처화 | 완료 | `tests/fixtures/projects.ts` |
| 5 파일 삭제 | 완료 | `data/*.json` 9개 + `add-project.md` 갱신 |

검증: `tsc` 통과 · 테스트 37/37 · 프로덕션 빌드 통과 · DB 무변경(23/9 유지).

### Phase 3 변경 요약

`project_registry_sync.py`:
- `load_local_bootstrap_payloads()` 삭제 (삭제된 JSON을 읽던 함수)
- `PortfolioBootstrapError` 도입 — 자격정보 누락·REST 실패·불완전 응답 시
  조용한 폴백 대신 **중단**한다
- 근거: 기존 동작은 예외를 삼키고 빈 baseline으로 진행했다. 파일이 사라진 지금
  그대로 두면 sync가 DB를 빈 값으로 덮어쓴다

원본 백업: 세션 scratchpad `prs.bak.py`

### 미검증 항목 (다음 실제 sync 때 확인 필요)

`PORTFOLIO_SYNC_API_URL` / `PORTFOLIO_SYNC_API_TOKEN`이 이 저장소의 `.env.local`에
없어 **정상 경로(REST 200)를 실측하지 못했다.** 실패 경로 2종(자격정보 누락,
연결 불가)은 예외 발생을 확인했다.

다음 sync 실행 시 확인할 것:
1. `Portfolio bootstrap: ok` 출력
2. 실행 후 DB projects가 23개 내외로 유지 (0개면 즉시 중단하고 Phase 0 백업으로 복구)
