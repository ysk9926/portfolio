# 방문 분석 및 기업별 제출 링크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. 체크박스를 완료 근거와 함께 갱신한다. 최초 요청은 계획 작성이었으며, 이후 사용자가 구현과 운영 DB 반영·커밋·푸시를 승인했다. 아래 체크리스트는 원래 세부 계획을 보존하며 최종 실행 근거와 차이는 `docs/analytics-operations.md`에 기록한다.

**Goal:** 기업별 제출 링크의 방문 기록과 섹션·프로젝트별 체류·스크롤을 기존 관리자 화면에서 확인한다.

**Architecture:** 공개 페이지의 클라이언트 수집기가 Next.js API로 이벤트 배치를 보내고, 서버가 검증 후 Supabase Postgres에 저장한다. 수집·시간 계산·전송·집계 모듈을 분리하고 관리자 API에는 기존 `getAdminContext()`를 적용한다. 페이지를 동적 사용자별 HTML로 바꾸지 않고 별도 설정 API에서 수집 가능 여부를 확인한다.

**Tech Stack:** 저장소의 Next.js 16.1.6 / React 19 / TypeScript / Zod 4 / Supabase / pg / node:test. 런타임 분석 SDK 추가 없이 구현하며 브라우저 테스트용 `@playwright/test`만 개발 의존성으로 추가한다.

**Spec:** [방문 분석 설계](../specs/2026-09-07-visitor-analytics-design.md). 설계와 이 실행 계획을 함께 읽는다. 기존 6단계 개요를 10개 작업으로 세분화했다.

## Global Constraints

- 수집 전 선택, 거절 시 미수집, 상세 기록 90일 보존.
- 수집은 15초 간격, 요청당 16KiB·50개 이벤트, 대기열 최대 200개 이벤트.
- 비활성 기준 60초, 새 세션 기준 30분, 세션 절대 수명 24시간.
- 저장 UTC, 관리자 표시 Asia/Seoul.
- 회사 링크 방문을 특정 담당자의 신원 또는 독해 확인으로 표현하지 않는다.
- 공개 렌더링과 관리자 인증은 기존 구조를 유지하고 수집 장애는 페이지 이용을 막지 않는다.
- 기존 이력서·PDF 등 미추적 파일은 작업에 포함하지 않는다. SQL/테스트 실행에 운영 DB를 자동 선택하지 않는다.
- 새 의존성의 정확한 버전은 구현 시 호환성을 확인해 lockfile에 기록한다. 본 계획 작성에서는 설치하지 않는다.

## 실행 순서와 파일 지도

`1 계약 → 2 저장 → 3 링크/세션 → 4 수집 API → 5 측정 엔진 → 6 전송/선택 → 7 화면 계측 → 8 조회 → 9 관리자 UI → 10 운영 검증`

| 경계 | 생성할 파일 | 역할 |
|---|---|---|
| 계약 | `lib/analytics/types.ts`, `schema.ts`, `constants.ts` | 이벤트, API DTO, 한계값 |
| 저장 | `lib/analytics/db.ts`, `repository.ts`, `rate-limit.ts` | 서버 전용 pg pool, 트랜잭션, 원자 제한 |
| 요청 처리 | `lib/analytics/auth.ts`, `links.ts`, `ingest.ts`, `admin-handler.ts` | 서명, 제출 링크, 검증, 관리자 권한 |
| 브라우저 | `lib/analytics/measurement.ts`, `tracker.ts`, `transport.ts`, `consent.ts` | 순수 시간 계산, DOM 관측, 전송, 선택 상태 |
| 공개 UI | `components/analytics/AnalyticsProvider.tsx`, `AnalyticsConsent.tsx`, `PortfolioTracker.tsx`, `ConsentSettingsButton.tsx`, `ConsentedGoogleAnalytics.tsx` | 공개 레이아웃 연결 |
| 조회/UI | `lib/analytics/queries.ts`, `filters.ts`, `components/admin/analytics/AnalyticsShell.tsx`, `AnalyticsDashboard.tsx`, `SessionDetail.tsx`, `TrackingLinks.tsx` | 통계 SQL, 필터, 관리자 화면 |
| 운영 | `scripts/analytics/purge.ts`, 2개 SQL migration | 90일 정리와 Cron |
| 검증 | `tests/analytics/*.test.ts`, `tests/analytics-db/*.test.ts`, `tests/e2e/analytics.spec.ts` | 순수/API, 실제 DB, 브라우저 테스트 |

기존 수정 파일은 각 작업에 명시한다. 모든 API route는 `runtime = 'nodejs'`, `Cache-Control: private, no-store`를 적용한다. 인증용 서버 모듈과 브라우저 모듈 사이에 barrel export를 만들지 않는다.

## 작업 1. 이벤트·요청·응답 계약 고정

**Files:** Create `lib/analytics/{types,schema,constants}.ts`, `tests/analytics/{fixtures,schema.test}.ts`; Modify `package.json`.

**Consumes:** 기존 Zod 및 node:test. **Produces:** 아래 타입, `batchSchema`, `sessionInputSchema`, `linkInputSchema`, `analyticsFilterSchema`.

- [ ] **1-1. 타입 및 실패 테스트 작성.** UUID는 API 경계에서 검증한다. `Region`의 projectId는 현재 `Project.id`에 맞춰 정수로 유지한다.

```ts
export type Region =
  | { kind: 'page' }
  | { kind: 'section'; key: 'hero' | 'about' | 'skills' | 'archiving' | 'activity' | 'projects' | 'career' }
  | { kind: 'project'; projectId: number; surface: 'modal' | 'detail' };
export type TargetKey = 'github' | 'blog' | 'email' | 'resume' | 'demo' | 'archive';
export type AnalyticsEvent = { atMs: number } & (
  | { type: 'page_start' }
  | { type: 'exposure_delta'; region: Region; startMs: number; endMs: number; visibleMs: number; activeMs: number }
  | { type: 'region_enter'; region: Region }
  | { type: 'scroll_state'; region: Region; depth: number; milestones: number[]; shortPage: boolean }
  | { type: 'interaction'; action: 'scroll' | 'click' | 'key' | 'pointer' | 'touch' }
  | { type: 'project_open' | 'project_close'; projectId: number; surface: 'modal' | 'detail' }
  | { type: 'outbound_click'; target: TargetKey; projectId?: number }
);
export interface EventBatch {
  sessionId: string;
  ingestToken: string;
  pageViewId: string;
  path: string;
  pageStartedAt: string;
  sequence: number;
  droppedEvents: number;
  events: AnalyticsEvent[];
}
export interface SessionInput {
  requestId: string;
  consent: 'granted';
  browserId: string | null;
  ref?: string;
  path: string;
  sourceOrigin?: string;
  utm?: Partial<Record<'source' | 'medium' | 'campaign', string>>;
}
export interface SessionCredentials {
  sessionId: string;
  ingestToken: string;
  expiresAt: string;
}
export interface LinkInput {
  companyLabel: string;
  position: string;
  submittedAt: string | null;
  note: string;
}
export interface TrackingLink extends LinkInput {
  id: string; createdAt: string; disabledAt: string | null;
}
export interface AnalyticsFilter {
  from: string; to: string;
  linkId?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  includeSuspectedBots: boolean;
  includeTest: boolean;
  limit: number;
  cursor?: string;
}
```

```ts
// tests/analytics/fixtures.ts
import type { EventBatch } from '../../lib/analytics/types';
export const makeBatch = (overrides: Partial<EventBatch> = {}): EventBatch => ({
  sessionId: '11111111-1111-4111-8111-111111111111',
  ingestToken: 'test-token',
  pageViewId: '22222222-2222-4222-8222-222222222222',
  path: '/', pageStartedAt: '2026-09-07T00:00:00.000Z',
  sequence: 0, droppedEvents: 0,
  events: [{ type: 'exposure_delta', atMs: 15000, region: { kind: 'page' },
    startMs: 0, endMs: 15000, visibleMs: 15000, activeMs: 15000 }],
  ...overrides,
});
```

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { batchSchema } from '../../lib/analytics/schema';
import { makeBatch } from './fixtures';
test('범위 밖 스크롤과 불필요한 개인정보 필드를 거부한다', () => {
  assert.equal(batchSchema.safeParse(makeBatch()).success, true);
  assert.equal(batchSchema.safeParse({ ...makeBatch(), email: 'x@example.test' }).success, false);
  assert.equal(batchSchema.safeParse(makeBatch({ events: [{ type: 'scroll_state', atMs: 0,
    region: { kind: 'page' }, depth: 101, milestones: [], shortPage: false }] })).success, false);
});
```

- [ ] **1-2.** `node --import tsx --test tests/analytics/schema.test.ts`를 실행해 미구현 schema로 인한 FAIL을 확인한다.
- [ ] **1-3. 스키마 구현.** discriminated union과 strict object를 사용한다. 각 이벤트의 atMs는 0~86,400,000 정수, 1배치 1~50개. exposure는 `0 ≤ activeMs ≤ visibleMs ≤ endMs-startMs ≤ 60000`, `atMs=endMs`. milestones는 중복 없는 25/50/75/90/100만 허용한다. scroll scope는 page/project만 허용한다. 경로는 `/`, `/projects/<slug>`, `/blog`, `/blog/<slug>`, `/blog/tags/<tag>`만 받고 query/hash·전체 URL·512자 초과를 거부한다. project ID는 양의 안전한 정수, ingestToken은 최대 512자. 링크 회사명 1~100자, 직무 200자, 메모 1000자, UTM 각각 100자, ref 22~64 URL-safe 문자. sourceOrigin은 http(s) origin으로 정규화한다.

```ts
export const LIMITS = {
  bodyBytes: 16 * 1024, batchEvents: 50, queuedEvents: 200,
  flushMs: 15_000, idleMs: 60_000, sessionIdleMs: 30 * 60_000,
  sessionTtlMs: 24 * 60 * 60_000, retentionDays: 90,
} as const;
// exposure의 superRefine에서 필드 간 관계도 검증한다:
// activeMs <= visibleMs && visibleMs <= endMs-startMs && atMs === endMs
```

- [ ] **1-4.** `test:analytics`와 기본 `test`에 `tests/analytics/*.test.ts`를 포함한다. 실제 DB 테스트 폴더는 기본 실행에서 분리한다. 위 테스트 및 기존 `npm test` PASS 후 해당 파일만 커밋: `feat: define visitor analytics contracts`.

## 작업 2. DB·원자 배치 저장·권한

**Files:** Create `supabase/migrations/202609070001_visitor_analytics.sql`, `lib/analytics/{db,repository,rate-limit}.ts`, `tests/analytics-db/{setup,repository.test,permissions.test}.ts`.

**Interfaces:** `createAnalyticsRepository(pool: Pool): AnalyticsRepository`는 DB 저장을 담당한다. 서명 발급은 작업 3에서 처리하며 아래 타입은 `lib/analytics/repository.ts`에서 export한다.

```ts
export interface StoredSession {
  id: string; startedAt: Date; expiresAt: Date; isTest: boolean;
}
export interface SessionMetadata {
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browserFamily: string; suspectedBot: boolean; isTest: boolean;
}
export interface AnalyticsRepository {
  createSession(input: SessionInput, meta: SessionMetadata, now: Date): Promise<StoredSession>;
  insertBatch(batch: EventBatch, now: Date): Promise<'inserted' | 'duplicate'>;
  sessionIsActive(id: string, now: Date): Promise<boolean>;
  deleteSession(id: string, now: Date): Promise<boolean>;
  takeRateLimit(key: string, limit: number, now: Date): Promise<boolean>;
}
```

- [ ] **2-1. 분리된 실제 DB 테스트 준비.** `tests/analytics-db/setup.ts`에서 `openAnalyticsTestDatabase()`를 제공해 `{pool, repository, close}`를 반환한다. `ANALYTICS_TEST_DB_URL` 누락 시 명시적 실패, `SUPABASE_DB_URL`과 같으면 거부한다. 로컬 Supabase의 기존 migration을 적용한 테스트 인스턴스만 사용하고 각 테스트는 생성한 ID만 정리한다. 테스트 실행은 `--test-concurrency=1`로 한다.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { makeBatch } from '../analytics/fixtures';
import { openAnalyticsTestDatabase } from './setup';
test('같은 배치를 재전송해도 한 번만 저장한다', async () => {
  const db = await openAnalyticsTestDatabase();
  try {
    const now = new Date('2026-09-07T00:00:00Z');
    const session = await db.repository.createSession({
      requestId: crypto.randomUUID(), consent: 'granted', browserId: null, path: '/',
    }, { device: 'unknown', browserFamily: 'unknown', suspectedBot: false, isTest: true }, now);
    const batch = makeBatch({ sessionId: session.id });
    assert.equal(await db.repository.insertBatch(batch, new Date(+now + 15000)), 'inserted');
    assert.equal(await db.repository.insertBatch(batch, new Date(+now + 16000)), 'duplicate');
    const result = await db.pool.query(
      'select count(*)::int as count from analytics_batches where page_view_id = $1', [batch.pageViewId]);
    assert.equal(result.rows[0].count, 1);
    await db.repository.deleteSession(session.id, now);
  } finally { await db.close(); }
});
```

- [ ] **2-2.** `node --import tsx --test --test-concurrency=1 tests/analytics-db/repository.test.ts`로 실패 확인. DB 미설정 실패를 기능 검증 성공으로 취급하지 않는다.
- [ ] **2-3. migration 작성.** 모든 시각은 timestamptz, ID는 uuid, 이벤트 payload는 jsonb. 기존 표보다 상세한 아래 필드를 구현한다.

| 테이블 | 필수 컬럼/제약 |
|---|---|
| analytics_links | id PK, token_hash unique, company_label, position, submitted_at date nullable, note, created_at, disabled_at nullable |
| analytics_sessions | id PK, request_id unique, input_hash, browser_id nullable, link_id FK nullable ON DELETE SET NULL, started_at, expires_at, last_received_at, first_path, source_origin nullable, utm jsonb, device, browser_family, suspected_bot bool, is_test bool |
| analytics_page_views | id PK, session_id FK CASCADE, path, client_started_at, first_received_at, last_received_at |
| analytics_batches | id PK, page_view_id FK CASCADE, sequence bigint CHECK >=0, payload_hash, received_at, dropped_events CHECK >=0, UNIQUE(page_view_id,sequence) |
| analytics_events | batch_id FK CASCADE, ordinal int, type, at_ms bigint CHECK >=0, payload jsonb, PRIMARY KEY(batch_id,ordinal) |
| analytics_rate_limits | key text PK, window_start timestamptz, count int, expires_at timestamptz |
| analytics_deleted_requests | request_hash text PK, expires_at timestamptz; 삭제된 세션의 재생성 방지 |

```sql
-- migration 내 각 분석 테이블에 동일 패턴 적용.
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_sessions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_sessions TO authenticated;
CREATE POLICY analytics_admin_only ON public.analytics_sessions
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX analytics_sessions_link_started ON public.analytics_sessions(link_id, started_at DESC, id DESC);
CREATE INDEX analytics_sessions_started ON public.analytics_sessions(started_at DESC, id DESC);
CREATE INDEX analytics_pages_session ON public.analytics_page_views(session_id);
-- UNIQUE(page_view_id,sequence)가 이미 생성한 인덱스를 재사용한다.
-- rates/tombstones는 authenticated에도 직접 조작을 허용하지 않는다.
```

- [ ] **2-4. repository 구현.** pg Pool max 3 / idleTimeoutMillis 10000 / connectionTimeoutMillis 5000; 파라미터 SQL 사용. 배치 저장은 세션 행 잠금→활성/소유 검사→페이지 upsert→배치 ON CONFLICT→본문 해시 대조→이벤트 INSERT→commit 순서. 페이지가 이미 다른 세션/경로에 속하면 409. canonical JSON을 키 정렬 후 해시하며 ingestToken은 해시 대상에서 제외한다. 중복 배치는 last_received_at을 늘리지 않는다. 요청 전체 오류 시 rollback.

```sql
INSERT INTO analytics_batches
  (id, page_view_id, sequence, payload_hash, received_at, dropped_events)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (page_view_id, sequence) DO NOTHING
RETURNING id;
```

- [ ] **2-5.** 2배치 역순 도착, 동시 중복 제출, 같은 sequence의 다른 payload 409, 삭제 후 새 배치 410, 일반 사용자 RLS 접근 실패를 실제 DB에서 확인한다. requestId 재시도는 동일 세션, 다른 본문은 409, 삭제한 requestId는 410. 성공 후 `feat: persist visitor analytics atomically` 커밋.

## 작업 3. 기업별 링크·서명·세션 시작

**Files:** Create `lib/analytics/{auth,links,admin-handler}.ts`, `app/api/analytics/{config,session}/route.ts`, `app/api/admin/analytics/links/route.ts`, `app/api/admin/analytics/links/[id]/route.ts`, `tests/analytics/{auth,session,links}.test.ts`.

**Interfaces:** `issueIngestToken(session: StoredSession, secret: string): string`; `verifyIngestToken(token: string, sessionId: string, now: Date, secret: string): boolean`; `createTrackingLink(input: LinkInput): Promise<{link: TrackingLink; url: string}>`; `assertAnalyticsAdmin(): Promise<Response | null>`.

- [ ] **3-1. 실패 테스트:** 만료와 세션 바꿔치기를 검사한다.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { issueIngestToken, verifyIngestToken } from '../../lib/analytics/auth';
test('서명은 세션과 만료에 묶인다', () => {
  const now = new Date('2026-09-07T00:00:00Z');
  const s = { id: 'a', startedAt: now, expiresAt: new Date(+now + 86400000), isTest: false };
  const secret = 'test-secret-with-at-least-32-bytes';
  const token = issueIngestToken(s, secret);
  assert.equal(verifyIngestToken(token, 'a', now, secret), true);
  assert.equal(verifyIngestToken(token, 'b', now, secret), false);
  assert.equal(verifyIngestToken(token, 'a', s.expiresAt, secret), false);
});
```

- [ ] **3-2.** `node --import tsx --test tests/analytics/auth.test.ts` FAIL를 확인한다.
- [ ] **3-3. 토큰 구현.** ref는 `randomBytes(16).toString('base64url')`, DB에는 SHA-256만 저장한다. ingestToken은 version/sessionId/expiry/isTest를 담은 base64url payload와 HMAC-SHA256 서명이며 길이를 먼저 검사하고 timingSafeEqual로 비교한다. 비밀키는 서버 전용 `ANALYTICS_SIGNING_SECRET`, 속도 제한 해시는 별도 `ANALYTICS_RATE_LIMIT_SECRET`을 사용한다.

```ts
import { createHash, randomBytes } from 'node:crypto';
const ref = randomBytes(16).toString('base64url');
const tokenHash = createHash('sha256').update(ref).digest('hex');
// 생성 응답 url: new URL(`/?ref=${ref}`, configuredSiteOrigin).toString()
// URL origin은 요청 Host가 아니라 SITE_URL 설정에서 얻는다.
```

- [ ] **3-4. API 구현.** config GET은 `{enabled, excluded, consentVersion:1, retentionDays:90, gaId:string|null}`; 식별자 생성이나 분석 기록 없음. 세션 POST는 sessionInput 검증 후 201 credentials, requestId 재시도 200. 서버가 ref 해시를 조회하고 unknown/disabled는 linkId null로 저장한다. GA ID를 포함해 관리자/preview 제외 상태를 판단한다. 세션 30분 유효성은 마지막 **새로운 배치** 수신 기준으로 보수적으로 검증하고 24시간 절대 만료를 함께 적용한다.
- [ ] **3-5. 관리자 API 구현.** 각 handler 시작에 `getAdminContext()` 검사(미로그인 401, 비관리자 403). POST 201 `{link,url}`, GET 200 `{links,nextCursor}`이며 hash/ref는 반환 금지. PATCH 허용 필드는 companyLabel/position/submittedAt/note/disabled뿐, 없는 ID 404. 비활성화 시 기존 세션은 남고 새 방문의 귀속만 막는다. DELETE /api/admin/analytics/links/[id]는 링크 라벨·메모를 삭제하고 기존 세션의 link_id는 SET NULL로 유지한다(204, 없는 ID 404). GET 목록도 기본 50개 cursor pagination. 관리자 변경 요청은 Origin 검사.
- [ ] **3-6.** A/B/무토큰 귀속, 중복 생성, 단 한 번 URL 노출, 링크 비활성, 관리자별 권한, 생산 환경 QA flag 강제 무시 테스트 PASS 후 `feat: add tracked portfolio links and sessions` 커밋.

## 작업 4. 공개 배치 수집·실패 격리

**Files:** Create `lib/analytics/ingest.ts`, `app/api/analytics/events/route.ts`, `tests/analytics/ingest.test.ts`; Modify `proxy.ts`.

**Interfaces:** `handleAnalyticsEvents(request: Request, deps: IngestDeps): Promise<Response>`; deps에는 enabled, allowedOrigin, now, verifyToken, isSessionActive, takeRateLimit, insertBatch를 주입한다. route는 환경/DB 의존성을 제공하는 얇은 어댑터로 둔다.

```ts
export interface IngestDeps {
  enabled: boolean; allowedOrigin: string; now(): Date;
  verifyToken(token: string, sessionId: string, now: Date): boolean;
  isSessionActive(id: string, now: Date): Promise<boolean>;
  takeRateLimit(key: string, limit: number, now: Date): Promise<boolean>;
  insertBatch(batch: EventBatch, now: Date): Promise<'inserted' | 'duplicate'>;
}
```

- [ ] **4-1. 저장 전 검증 실패 테스트.**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { handleAnalyticsEvents, type IngestDeps } from '../../lib/analytics/ingest';
import { makeBatch } from './fixtures';
test('잘못된 서명은 DB 쓰기 전에 거부한다', async () => {
  let writes = 0;
  const deps: IngestDeps = {
    enabled: true, allowedOrigin: 'https://portfolio.example', now: () => new Date(),
    verifyToken: () => false, isSessionActive: async () => true,
    takeRateLimit: async () => true, insertBatch: async () => { writes++; return 'inserted'; },
  };
  const req = new Request('https://portfolio.example/api/analytics/events', {
    method: 'POST', headers: { origin: deps.allowedOrigin, 'content-type': 'application/json' },
    body: JSON.stringify(makeBatch()),
  });
  assert.equal((await handleAnalyticsEvents(req, deps)).status, 401);
  assert.equal(writes, 0);
});
```

- [ ] **4-2.** `node --import tsx --test tests/analytics/ingest.test.ts`로 FAIL 확인.
- [ ] **4-3. 수신 pipeline 구현.** enabled→Origin→Content-Type→stream byte limit→JSON→schema→서명→세션 존재/만료→속도 제한→저장 순서. Origin 누락·다른 Origin 403, content-type은 `application/json` 및 charset만 허용한다. Beacon도 JSON Blob 사용. Content-Length만 신뢰하지 않는다.

```ts
// request.body reader에서 누적 크기 검사; 초과 즉시 cancel 후 413.
let size = 0;
const reader = request.body?.getReader();
if (!reader) return new Response(null, { status: 400 });
const chunks: Uint8Array[] = [];
while (true) {
  const next = await reader.read();
  if (next.done) break;
  size += next.value.byteLength;
  if (size > 16384) { await reader.cancel(); return new Response(null, { status: 413 }); }
  chunks.push(next.value);
}
```

- [ ] **4-4. rate-limit 원자화.** 분별 window를 키에 포함하고 `INSERT ... ON CONFLICT DO UPDATE count=count+1 RETURNING count` 사용. 세션당 10배치/분, 세션 생성 IP HMAC당 30회/분. HMAC 입력은 UTC 날짜+신뢰된 ingress IP. IP 헤더 신뢰는 배포 preflight에서 실제 프록시를 검증한 경우만 설정하고 임의 X-Forwarded-For fallback 금지. 테스트는 주입한 IP 사용. 카운터 TTL 24시간.
- [ ] **4-5. proxy 수정.** 기존 canonical redirect를 먼저 유지한 뒤 정확히 `/api/analytics/events`만 `updateSession()`에서 제외해 heartbeat마다 Supabase auth 호출이 발생하지 않게 한다. config/session/admin 경로의 인증 흐름은 유지한다.
- [ ] **4-6.** 400/401/403/409/410/413/415/429/503 테스트, 수집 중지 204(no write), 429의 Retry-After 60, 성공/중복 204 확인. 원문 본문·토큰·IP가 오류 로그에 없는지 검사 후 `feat: ingest validated analytics batches` 커밋.

## 작업 5. 노출·활성 시간 순수 엔진

**Files:** Create `lib/analytics/measurement.ts`, `tests/analytics/measurement.test.ts`.

**Interfaces:** 아래 객체는 DOM 없이 시각을 주입받는다. tracker만 DOM을 다룬다.

```ts
export interface Measurement {
  setVisible(visible: boolean, nowMs: number): void;
  activity(nowMs: number): void;
  setRegion(region: Region | null, nowMs: number): void;
  drain(nowMs: number): AnalyticsEvent[];
}
export function createMeasurement(startMs: number): Measurement;
export function calculateDepth(top: number, height: number, viewport: number): number;
export function chooseRegion(
  candidates: { region: Region; area: number; order: number }[],
  previous: Region | null,
): Region | null;
```

- [ ] **5-1. 숨김/idle 실패 테스트 작성.**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMeasurement } from '../../lib/analytics/measurement';
test('숨김 시간은 제외하고 돌아온 실제 활동만 누적', () => {
  const m = createMeasurement(0);
  m.setRegion({ kind: 'section', key: 'projects' }, 0);
  m.setVisible(true, 0);
  m.setVisible(false, 20000);
  m.setVisible(true, 80000);
  m.activity(80000);
  const page = m.drain(90000).filter(e => e.type === 'exposure_delta' && e.region.kind === 'page');
  assert.equal(page.reduce((sum, e) => sum + (e.type === 'exposure_delta' ? e.activeMs : 0), 0), 30000);
});
test('입력 없이 90초 표시하면 활성 시간은 60초', () => {
  const m = createMeasurement(0);
  m.setVisible(true, 0);
  const events = m.drain(90000);
  const page = events.filter(e => e.type === 'exposure_delta' && e.region.kind === 'page');
  assert.equal(page.reduce((sum, e) => sum + (e.type === 'exposure_delta' ? e.activeMs : 0), 0), 60000);
});
```

- [ ] **5-2.** `node --import tsx --test tests/analytics/measurement.test.ts` FAIL 확인.
- [ ] **5-3. 구간 정산 구현.** 상태가 바뀌기 직전 구간을 정산하고 page와 현재 대표 region에 각각 이벤트를 쌓는다. idle 끝점을 지나면 active 부분만 잘라서 계산한다. 60초를 넘는 구간은 분할한다. `setVisible(true)`는 최초 표시에서만 activity를 초기화하며 단순 복귀는 이전 활동 시각을 갱신하지 않는다.

```ts
const visibleMs = visible ? Math.max(0, endMs - startMs) : 0;
const activeMs = visible
  ? Math.max(0, Math.min(endMs, lastActivityMs + 60_000) - startMs)
  : 0;
// 60초 이내 구간별로 위 계산 후 atMs=endMs 설정.
// region 변경 전에 정산해 이전/다음 영역이 동일 구간을 함께 차지하지 않게 한다.
```

- [ ] **5-4. 대표 영역/스크롤 구현.** intersectionRatio 대신 viewport와 겹친 면적을 계산한다. area>0 중 최대, 동률 이전 대표, 다음 DOM order. 모달은 최고 우선순위. region_enter는 대표 여부와 무관하게 실제 0→양수 노출 때 기록하며 초기 진입도 포함한다. 스크롤 계산은 0~100 clamp, 분모<=0은 100+shortPage. 레이아웃 변경은 interaction을 발생시키지 않는다.
- [ ] **5-5.** 화면보다 긴 섹션, 동률, 0면적, 모달 교체, 2회 drain 중복 없음, page 합계≥영역 합계, idle 경계 59999/60000/60001 테스트 PASS 후 `feat: measure visible and active portfolio time` 커밋.

## 작업 6. 세션 수명·전송·수집 선택

**Files:** Create `lib/analytics/{transport,consent}.ts`, `components/analytics/{AnalyticsProvider,AnalyticsConsent,ConsentSettingsButton,ConsentedGoogleAnalytics}.tsx`, `tests/analytics/{transport,consent}.test.ts`; Modify `app/layout.tsx`, `app/(site)/layout.tsx`, `components/layout/Footer.tsx`, `components/blog/BlogViewTracker.tsx`.

**Interfaces:** `Consent = 'unknown'|'granted'|'denied'`; provider context는 `{consent,setConsent,openSettings,enabled,track(event: AnalyticsEvent):void}`. `createTransport(send: (batch: EventBatch)=>Promise<number>)`는 `enqueue(batch)`, `flush():Promise<void>`, `stop():void`를 제공한다. 같은 batch 재시도는 내용/sequence를 변경하지 않는다.

- [ ] **6-1. 재시도 계약 테스트 작성.**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createTransport } from '../../lib/analytics/transport';
import { makeBatch } from './fixtures';
test('503 재시도에도 배치 식별자와 payload를 유지', async () => {
  const sent: string[] = [];
  const t = createTransport(async batch => { sent.push(JSON.stringify(batch)); return sent.length === 1 ? 503 : 204; });
  t.enqueue(makeBatch());
  await t.flush();
  await t.flush();
  assert.equal(sent.length, 2);
  assert.equal(sent[0], sent[1]);
  t.stop();
});
```

- [ ] **6-2.** `node --import tsx --test tests/analytics/transport.test.ts` FAIL 확인.
- [ ] **6-3. 전송 구현.** 이벤트→배치 분할은 UTF-8 직렬화 바이트+전체 envelope를 기준으로 한다. 50개/16KiB 한계, sequence 단조 증가, 큐 200개 초과 시 오래된 **배치 전체** 제거 후 droppedEvents를 다음 배치에 기록한다. 204만 dequeue, 400/401/403/409/410은 해당 배치 폐기, 413은 전송 전 분할 오류로 진단하며 무한 재시도 금지. 503/네트워크는 최대 3회, 1/2/4초 backoff; 429는 Retry-After. 테스트에서는 scheduler를 가짜 시계로 대체할 수 있도록 timing 옵션을 주입한다. 동시에 flush하지 않는다.

```ts
const body = JSON.stringify(batch);
const queued = navigator.sendBeacon('/api/analytics/events', new Blob([body], { type: 'application/json' }));
// queued=true여도 ACK로 보지 않는다. 문서가 복귀하면 동일 배치를 재전송한다.
// false이면 fetch(...,{method:'POST',body,headers:{'content-type':'application/json'},keepalive:true}).
```

- [ ] **6-4. 세션 관리.** requestId를 생성 요청 동안 메모리에 보관하고 실패 재시도에 재사용. pageViewId/자격증명은 문서 메모리만 사용한다. full reload/new tab은 새 세션. SPA 경로 이동은 기존 세션·새 page ID, 30분 비활동·24시간 절대 만료·새 ref는 새 세션. bfcache 복귀는 대기열 우선 전송 후 새 page ID. 만료된 이전 행동을 새 세션에 재귀속하지 않는다. config는 시작 시와 공개 문서가 visible인 동안 60초마다 다시 확인한다. config 실패는 수집 중지, 페이지는 정상 표시.
- [ ] **6-5. 선택 UI.** 설명: “어떤 내용이 도움이 되는지 확인하기 위해 방문 경로·스크롤·체류 시간을 90일간 저장합니다.” 버튼 “허용”, “거절”; 푸터 “방문 분석 설정”. 선택은 version/time을 포함해 localStorage에 180일, browserId는 동의 후 최대 90일. 저장 불가 시 메모리 선택+browserId null. UUID는 동의 전 생성하지 않는다. ref/허용 UTM은 페이지 진입 때 메모리에 읽고 URL에서 제거한다. 동의 전 경로 이력을 쌓지 않는다. 다른 ref를 만나면 이전 메모리 값을 교체한다. 같은 문서에서 ref만 변경된 navigation도 감지해 새 세션을 시작한다. ref 제거를 위한 history.replaceState 자체는 페이지 이동으로 집계하지 않는다.
- [ ] **6-6. GA/블로그 연결.** root의 무조건 GoogleAnalytics 렌더를 제거하고 공개 provider 안에서만 허용 후 로드한다. tag 로드 전 정규화 URL을 보장하고 자동 history pageview 설정도 ref가 포함되지 않는지 확인한다. 철회 시 수집 stop·미전송 큐 폐기·진행 fetch abort·ID 삭제·선택 저장 후 GA disable 플래그 설정 및 hard reload로 로드된 태그를 제거한다. 철회 전에 이미 발송한 요청은 취소 보장 대상이 아니다. 블로그 조회수 fetch/localStorage 기록은 granted+enabled에서만 실행한다.
- [ ] **6-7.** 미선택/거절/철회 후 analytics·GA·blog view 요청 0, storage exception, admin/preview 제외, 중복 마운트, 서명 만료, 네트워크 장애 검증 PASS 후 `feat: add consent-aware analytics transport` 커밋.

## 작업 7. 실제 포트폴리오 DOM·모달 계측

**Files:** Create `lib/analytics/tracker.ts`, `components/analytics/PortfolioTracker.tsx`; Modify `components/ui/SectionWrapper.tsx`, `components/sections/Hero.tsx`, `components/sections/Projects.tsx`, `components/ui/ProjectModal.tsx`, `components/ui/ProjectCard.tsx`, `components/ui/ArchiveCard.tsx`, `components/ui/ProjectTimelineView.tsx`, `components/ui/ProjectVerticalTimelineView.tsx`, `app/(site)/projects/[slug]/page.tsx`; Test `tests/analytics/tracker.test.ts`.

**Interfaces:** `startTracker({root:Document, now:()=>number, emit:(event:AnalyticsEvent)=>void}):()=>void`; 반환값은 리스너·observer·timer 정리 함수. 프로젝트 identity는 숫자 ID, 상세 경로는 기존 `projectPath()`를 계속 사용한다.

- [ ] **7-1. 관측 대상 명시.** SectionWrapper와 Hero에는 data-analytics-section, 프로젝트 모달의 실제 `overflow-y-auto` div에는 data-analytics-project 및 surface=modal, 상세 article에는 surface=detail 속성. 이벤트 리스너는 modal portal을 포함하는 document에 설치한다.

```tsx
<section id={id} data-analytics-section={id} className={className}>
  {children}
</section>
// ProjectModal: overlay가 아니라 modalRef가 있는 실제 스크롤 div.
<div ref={modalRef} data-analytics-project={project.id} data-analytics-surface="modal" />
// ProjectDetailPage:
<article data-analytics-project={project.id} data-analytics-surface="detail" />
// 명시된 링크에만 계측 속성 부여.
<a href={project.githubUrl} data-analytics-target="github" data-analytics-project-id={project.id}>GitHub</a>
```

- [ ] **7-2. 모달 우선순위 테스트 작성.** 아래 테스트를 measurement 테스트와 함께 실행하고 tracker 연결 전 브라우저 시나리오가 실패하는 것을 확인한다.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMeasurement } from '../../lib/analytics/measurement';
test('모달 체류는 배경 Projects에 추가되지 않는다', () => {
  const m = createMeasurement(0); m.setVisible(true, 0);
  m.setRegion({ kind: 'section', key: 'projects' }, 0);
  m.setRegion({ kind: 'project', projectId: 1, surface: 'modal' }, 20000);
  const events = m.drain(50000);
  const sum = (kind: string) => events.reduce((s, e) => s +
    (e.type === 'exposure_delta' && e.region.kind === kind ? e.activeMs : 0), 0);
  assert.equal(sum('page'), 50000);
  assert.equal(sum('section'), 20000);
  assert.equal(sum('project'), 30000);
});
```

- [ ] **7-3. observer 연결.** IntersectionObserver는 노출 후보 관리, 200ms 제한 scroll/resize와 ResizeObserver는 현재 rect 재계산, MutationObserver는 모달/경로 변경 시 대상 등록에 사용한다. 페이지가 hidden이면 측정을 정산한 후 stop. pointer/key/touch는 값 없이 활동 시각만 갱신하며 interaction 전송은 종류별 배치당 한 번으로 합친다. 클릭은 document capture에서 `closest('[data-analytics-target]')`로 읽어 stopPropagation 링크도 놓치지 않는다.
- [ ] **7-4. 경로 이동/종료 처리.** 이동 직전 이전 페이지 drain·flush 후 observer 재설정. window scroll과 모달 scroll을 분리하고 모달 중 background scroll 이벤트는 무시한다. 닫기 애니메이션 시작 시점이 아니라 모달 실제 제거 시 project_close. 탭 숨김은 닫힘으로 처리하지 않는다. 경로 종료/모달 교체 시 close를 한 번만 기록한다.
- [ ] **7-5.** card/timeline/vertical 세 보기에서 모달 및 상세 페이지 이벤트가 누락되지 않는지 확인한다. resume PDF는 클릭만 추적하고 실제 다운로드 완료로 표시하지 않는다. 외부 URL query/text가 payload에 없는지 확인 후 `feat: instrument portfolio sections and projects` 커밋.

## 작업 8. 관리자 통계·상세 조회 API

**Files:** Create `lib/analytics/{queries,filters}.ts`, `app/api/admin/analytics/route.ts`, `app/api/admin/analytics/sessions/[id]/route.ts`, `tests/analytics/filters.test.ts`, `tests/analytics-db/queries.test.ts`.

**Interfaces:** `parseAnalyticsFilter(params:URLSearchParams,now:Date):AnalyticsFilter`; `getAnalyticsDashboard(filter:AnalyticsFilter):Promise<DashboardData>`; `getSessionDetail(id:string):Promise<SessionDetailData|null>`.

```ts
export interface SessionRow {
  id: string; companyLabel: string | null; startedAt: string; lastReceivedAt: string;
  activeMs: number; maxDepth: number; projectViews: number;
  observedActivity: boolean; suspectedBot: boolean; isTest: boolean;
}
export interface DashboardData {
  summary: { sessions: number; browsers: number; medianActiveMs: number; observedSessions: number };
  links: { linkId: string | null; companyLabel: string | null; sessions: number; observedSessions: number }[];
  sessions: SessionRow[]; nextCursor: string | null;
}
export interface SessionDetailData {
  session: SessionRow;
  pages: { id: string; path: string; startedAt: string; activeMs: number; maxDepth: number;
    regions: { region: Region; visibleMs: number; activeMs: number; entries: number }[] }[];
  timeline: { pageViewId: string; atMs: number; event: AnalyticsEvent }[];
  droppedEvents: number;
}
```

- [ ] **8-1. 시간 경계 테스트 작성.**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAnalyticsFilter } from '../../lib/analytics/filters';
test('한국 날짜를 UTC 반열린 구간으로 변환한다', () => {
  const f = parseAnalyticsFilter(new URLSearchParams('from=2026-09-07&to=2026-09-07'), new Date('2026-09-07T10:00:00Z'));
  assert.equal(f.from, '2026-09-06T15:00:00.000Z');
  assert.equal(f.to, '2026-09-07T15:00:00.000Z');
});
```

- [ ] **8-2.** `node --import tsx --test tests/analytics/filters.test.ts` FAIL 확인.
- [ ] **8-3. 집계 SQL.** date 필터는 session.started_at 기준의 코호트이며 화면에도 “방문 시작일 기준” 표시. `[from,to)` 최대 90일, 기본 최근 7일. summary는 필터 전체이며 cursor는 목록에만 적용한다. `(started_at,id)` 내림차순 cursor, 입력 cursor 구조 검증. page exposure만 sum, region은 상세 전용. median은 세션별 page sum을 구한 뒤 percentile_cont(0.5). browserId null은 distinct browser 수에서 제외한다. 테스트/자동화 의심 기본 제외 조건을 summary/list/detail 링크 집계에 일관 적용한다.

```sql
-- JSONB payload의 region.kind='page'인 exposure만 전체 활성 시간에 포함.
SUM(CASE WHEN e.type = 'exposure_delta' AND e.payload->'region'->>'kind' = 'page'
  THEN (e.payload->>'activeMs')::bigint ELSE 0 END) AS active_ms
-- 프로젝트 열람 수: project_open 횟수. 고유 프로젝트 수와 혼용하지 않는다.
-- observedActivity: page active>=10000 OR interaction.action IN ('scroll','click') OR outbound_click.
```

- [ ] **8-4. 상세/삭제.** 타임라인은 page.client_started_at, event.at_ms, sequence, ordinal로 안정 정렬하되 클라이언트 시계 추정 순서임을 설명한다. deleted-request tombstone과 세션 CASCADE 삭제는 한 트랜잭션. 없는 ID 404, 삭제 성공 204. 관리자 공통 권한과 Origin 검사는 작업 3 함수 사용.
- [ ] **8-5.** page=50초/section=20초/project=30초 데이터에서 전체=50초, 중복 배치 후 동일, 날짜 경계/빈 목록/median/2페이지 합계 고정 테스트 PASS 후 `feat: query visitor analytics for admins` 커밋.

## 작업 9. 관리자 대시보드·링크 관리 UI

**Files:** Create `tests/e2e/admin.setup.ts`, `playwright.config.ts`, `app/admin/(protected)/analytics/page.tsx`, `components/admin/analytics/{AnalyticsShell,AnalyticsDashboard,SessionDetail,TrackingLinks}.tsx`; Modify `.gitignore`, `package.json`, `package-lock.json`, `components/admin/AdminShell.tsx`, `components/admin/blog/AdminBlogShell.tsx`; Test `tests/e2e/analytics-admin.spec.ts`.

**Consumes:** 작업 8 DTO와 작업 3 링크 API. **Produces:** `/admin/analytics` 및 콘텐츠/블로그 관리자 양쪽의 데스크톱·모바일 진입점.

- [ ] **9-1. 실패 브라우저 테스트 작성.** 신규 `tests/e2e/admin.setup.ts`에서 `ANALYTICS_TEST_ADMIN_EMAIL`/`ANALYTICS_TEST_ADMIN_PASSWORD`로 실제 `/admin/login` 로그인 후 `tests/e2e/.auth/admin.json`에 storageState를 저장한다. 해당 폴더를 `.gitignore`에 추가하고 관리자 테스트 프로젝트만 storageState를 사용한다. 방문자 테스트 프로젝트는 빈 context를 사용한다. 테스트 Supabase에 관리자를 사전 생성하고 `admin_users`에 등록한다. 자격증명 누락은 setup 실패로 표시한다. 프로덕션 인증 우회 코드는 추가하지 않는다.

```ts
import { test, expect } from '@playwright/test';
test('회사 제출 링크를 발급하고 방문 분석으로 돌아온다', async ({ page }) => {
  await page.goto('/admin/analytics');
  await page.getByRole('tab', { name: '제출 링크' }).click();
  await page.getByLabel('회사명').fill('테스트 A사');
  await page.getByLabel('지원 직무').fill('프론트엔드');
  await page.getByRole('button', { name: '링크 발급' }).click();
  await expect(page.getByLabel('발급된 링크')).toHaveValue(/\?ref=[A-Za-z0-9_-]{22,64}$/);
  await expect(page.getByText('링크는 지금 복사해 주세요. 다시 필요하면 새 링크를 발급합니다.')).toBeVisible();
});
```

- [ ] **9-2. Playwright 설치/설정.** `npm install -D @playwright/test`, `npx playwright install chromium webkit`. `playwright.config.ts`에 testDir `tests/e2e`, Chromium/WebKit 프로젝트와 로컬 Next webServer 설정. default baseURL은 테스트 전용 localhost이며 외부 URL은 명시 허용 없이는 거부한다. 위 테스트의 화면 부재 FAIL 확인.
- [ ] **9-3. UI 구현.** AnalyticsShell에 콘텐츠/블로그 돌아가기·분석 메뉴·로그아웃 제공. 필터는 URLSearchParams와 동기화. 모바일은 세션 카드, 데스크톱은 표, 상세는 drawer. 상단 4개 지표·회사 링크별 요약·세션별 영역 막대·페이지별 스크롤·관측 품질 표시. CSS 막대와 숫자 텍스트로 구현해 차트 의존성을 추가하지 않는다.

```tsx
<div aria-label={`${label} 활성 체류 ${seconds}초`}>
  <span>{label}</span><span>{seconds}초</span>
  <div aria-hidden="true" style={{ width: `${percentage}%` }} className="h-2 bg-neutral-800" />
</div>
```

- [ ] **9-4. 상태/관리 기능.** loading/empty/error 분리, 재시도 버튼, 이전 필터 요청 AbortController 취소, 401은 로그인 이동. 링크 수정/메모/비활성화/삭제/복사(실패 시 선택 가능한 input). 링크 삭제는 회사 라벨을 보여 주고 기존 방문이 출처 미확인으로 바뀜을 안내한다. 세션 삭제는 대상 회사/시각을 보여주는 확인 UI를 제공한다. 시스템이 사용자를 “인사담당자”로 자동 라벨링하지 않는다.
- [ ] **9-5.** 375px/1280px에서 메뉴·필터·상세·복사·에러·삭제 동작, 키보드 focus/닫기, QA 라벨, 기업별 통계와 전체 요약 일치 확인 후 `feat: add admin visitor analytics dashboard` 커밋.

## 작업 10. 보존 작업·실제 브라우저 검증·운영 적용

**Files:** Create `supabase/migrations/202609070002_visitor_analytics_cron.sql`, `scripts/analytics/purge.ts`, `tests/analytics-db/retention.test.ts`, `tests/e2e/analytics.spec.ts`, `docs/analytics-operations.md`; Modify `README.md`, `package.json`, `package-lock.json`.

**Interfaces:** `purgeAnalytics(pool:Pool, now:Date, dryRun:boolean):Promise<{sessions:number;rateLimits:number;tombstones:number}>`. Cron과 CLI는 동일 DB 정리 함수를 호출한다. `ANALYTICS_ENABLED`는 서버 런타임 스위치이며 비활성 상태로 먼저 배포한다.

- [ ] **10-1. 보존 실패 테스트 작성.** 테스트 DB에 현재-91일/89일 세션을 createSession으로 넣고 dry-run 전후 존재 확인. 실제 purge 후 91일만 삭제, 이벤트 CASCADE, 최근 세션·링크 유지, 24시간 지난 rate-limit 및 90일 지난 tombstone 삭제 검증.
- [ ] **10-2. 정리 함수와 SQL 예약 구현.** purge 함수는 고정 search_path와 server-only execute 권한, now 인자는 CLI/테스트에서만 명시한다. 세션 기준은 started_at. 함수 결과는 삭제된 row 수를 반환한다. 중복 실행은 advisory lock으로 방지한다.

```sql
-- 본체 migration에 public.analytics_purge(p_now timestamptz, p_dry_run boolean) 정의.
-- 운영 설정에서 pg_cron 활성화 확인 후 별도 migration으로 예약.
SELECT cron.schedule(
  'portfolio-analytics-retention',
  '0 18 * * *',
  $$SELECT public.analytics_purge(now(), false);$$
);
-- UTC 18:00 = Asia/Seoul 03:00. 재적용 시 같은 이름 job 갱신 여부 확인.
```

- [ ] **10-3. 실행 명령 연결.**

```json
{
  "test:analytics": "node --import tsx --test tests/analytics/*.test.ts",
  "test:analytics:db": "node --import tsx --test --test-concurrency=1 tests/analytics-db/*.test.ts",
  "test:e2e:analytics": "playwright test tests/e2e/analytics.spec.ts tests/e2e/analytics-admin.spec.ts",
  "analytics:purge": "tsx scripts/analytics/purge.ts",
  "analytics:purge:dry-run": "tsx scripts/analytics/purge.ts --dry-run"
}
```

- [ ] **10-4. 실제 수집 E2E 작성.** API를 mock하지 않는 별도 Chromium/WebKit 시나리오로 링크 발급→동의→섹션→모달→클릭→관리자 조회까지 검증한다. 관리자/방문자를 다른 browser context로 분리하고 프로젝트 fixture는 테스트 DB에 실제 공개 프로젝트 ID를 준비한다. 이 E2E는 데이터 소스로 사용하는 `NEXT_PUBLIC_SUPABASE_URL`/publishable key와 `SUPABASE_DB_URL`이 같은 테스트 인스턴스를 가리키는지 먼저 확인한다. PostgreSQL URL만 테스트로 바꾸고 Auth를 운영에 연결하지 않는다. 개발 테스트 수집은 서버 `ANALYTICS_QA_MODE=true`일 때만 가능하며 모든 세션 is_test=true. 운영 `VERCEL_ENV=production` 또는 명시 APP_ENV=production에서는 QA mode 무시.

```ts
import { test, expect } from '@playwright/test';
test('선택 전에는 행동 분석을 보내지 않는다', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', req => {
    if (/\/api\/analytics\/(session|events)$/.test(new URL(req.url()).pathname)) requests.push(req.url());
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '허용', exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('button', { name: '거절', exact: true }).click();
  await expect(page.getByRole('button', { name: '방문 분석 설정' })).toBeVisible();
  expect(requests).toEqual([]);
});
```

- [ ] **10-5. 다음 필수 시나리오 실행.** Projects 20초→모달 30초→GitHub 클릭: 페이지=약50초, 배경20초, 모달30초(브라우저 허용 오차 ±2초). hidden60초 추가 후 합계 증가 없음. 5분 동안 주기 요청 약20회+경계 flush이며 매 scroll 요청 없음. 탭 복제/새로고침/뒤로 가기/저장소 차단/503 후 재시도/잘못된 서명/데이터 삭제 후 늦은 재전송을 확인한다. 대기 시간은 테스트 runner가 처리하고 보고용 실제 수동 검증은 Chromium 및 모바일 Safari에서 수행한다.
- [ ] **10-6. 변경 전체 검증.** `npm test`, `npm run test:analytics:db`, `npm run lint`, `npm run build`, `npm run test:e2e:analytics`. 실패가 기존 문제라면 변경 전 재현 근거와 영향을 기록하고 성공으로 표시하지 않는다. 테스트용 URL/계정/DB 미설정은 미실행으로 기록한다.
- [ ] **10-7. 운영 체크를 문서화한다.** 환경변수 `ANALYTICS_ENABLED=false`, `ANALYTICS_SIGNING_SECRET`, `ANALYTICS_RATE_LIMIT_SECRET`, 기존 `SUPABASE_DB_URL`, `SITE_URL`; 테스트 전용 `ANALYTICS_TEST_DB_URL`, `ANALYTICS_QA_MODE`. 환경 파일 값을 출력하지 않는다. trusted IP header는 실제 hosting ingress 계약을 확인한 뒤 설정한다. 기존 GA history/pageview 설정과 URL 로그 query 보존 범위를 확인한다. 비밀키 없는 환경은 수집을 비활성화한다.
- [ ] **10-8. 적용 순서.** 테스트 DB→비활성 운영 배포→기본 migration→Cron 확장 및 예약→권한/정리 dry-run→분리된 preview QA 검증→운영 활성화→수신 성공률/최근 Cron 결과 확인. 작업이 허용된 시점에 실행한다. `cron.job_run_details`에서 성공과 최근 시각을 확인하고 기록이 없으면 운영 검증 미완료로 남긴다.
- [ ] **10-9. 롤백.** `ANALYTICS_ENABLED=false`로 API 쓰기 중단, 다음 config 재검사(최대60초) 시 클라이언트 중단. GA도 동일 switch를 따르고 이미 로드된 태그는 disable 후 다음 문서 진입부터 로드하지 않는다. 중지 시 이미 전송 중인 외부 요청의 취소는 보장하지 않는다. 테이블과 관리자 조회는 유지해 원인 확인/정리를 계속한다. 실험용 행은 관리자 삭제 기능으로 제거한다. 운영 문서까지 확인한 뒤 `feat: verify and operate portfolio analytics` 커밋.

## 완료 기준과 검증 기록

| 요구사항 | 구현 작업 | 완료 근거 |
|---|---|---|
| 회사 제출 링크 귀속 | 2,3,9 | A/B/일반 방문 분리 E2E |
| 방문 저장·재방문 추정 | 1,2,3,6,8 | 세션 수와 browserId 집계 DB 테스트 |
| 섹션 체류·스크롤 | 5,7,8 | 가짜 시계+실제 스크롤 E2E |
| 프로젝트 모달/상세 | 5,7 | 20초/30초 분리 및 3가지 프로젝트 보기 확인 |
| 관리자 인증·정보 비공개 | 2,3,4,8 | API 401/403·RLS 테스트 |
| 선택·철회·기존 분석 연계 | 6,10 | 새 요청 없음 네트워크 검증 |
| 중복·역순·종료 손실 | 2,4,6 | 동시 DB 테스트·Beacon 복귀/재시도 검증 |
| 보존·수집 중지 | 10 | dry-run, Cron 성공, switch 동작 |

각 작업 완료 시 문서 아래에 실행한 명령·결과·미실행 사유만 추가한다. 현재는 **계획 작성 완료 / 구현 및 테스트 실행 전** 상태다.

## 확인한 기술 문서

- 노출과 탭 상태 분리: [MDN 노출 시간 측정](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API/Timing_element_visibility).
- 종료 전송과 크기 제한: [MDN sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon).
- 공개 DB 접근 제한: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- SQL 정리 예약: [Supabase Cron Quickstart](https://supabase.com/docs/guides/cron/quickstart).
- 선택 전 태그 미로딩: [Google consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).
- 기존 GA 컴포넌트 통합 방식: [Next.js Third Party Libraries](https://nextjs.org/docs/app/guides/third-party-libraries).
