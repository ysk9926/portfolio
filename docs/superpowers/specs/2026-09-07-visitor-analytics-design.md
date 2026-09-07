# 방문 분석 및 기업별 제출 링크 설계

상태: 사용자가 2026-09-07 설계 방향에 동의하고 상세 구현 계획 작성을 요청했다. 아래 구현 세부 기준은 기존 방향을 구체화한 것이다.

구현 계획: [상세 실행 계획](../plans/2026-09-07-visitor-analytics.md)

## 공통 제약

- 수집 전 선택, 거절 시 미수집, 상세 기록 90일 보존.
- 수집은 15초 간격, 요청당 16KiB·50개 이벤트, 대기열 최대 200개 이벤트.
- 비활성 기준 60초, 새 세션 기준 30분, 세션 절대 수명 24시간.
- 저장 UTC, 관리자 표시 Asia/Seoul.
- 회사 링크 방문을 특정 담당자의 신원 또는 독해 확인으로 표현하지 않는다.
- 공개 렌더링과 관리자 인증은 기존 구조를 유지하고 수집 장애는 페이지 이용을 막지 않는다.

## 1. 현재 구조와 구현 방향

- `app/(site)/layout.tsx`에 공개 페이지 공통 수집기를 설치할 수 있다.
- 홈에는 `hero`, `about`, `skills`, `archiving`, `activity`, `projects`, `career` 식별자가 있다. 대부분 `components/ui/SectionWrapper.tsx`를 사용한다.
- 프로젝트는 `components/sections/Projects.tsx`에서 모달을 열고, 별도 `app/(site)/projects/[slug]/page.tsx`도 있다. 두 경로 모두 측정해야 한다.
- `lib/admin.ts`의 `getAdminContext()`와 보호 레이아웃을 재사용한다. 관리자 API도 각각 인증을 검사한다.
- `app/layout.tsx`에는 환경변수로 활성화하는 Google Analytics 코드가 있다. 실제 운영 활성화 여부는 확인하지 않았다.
- 기존 `BlogViewTracker`는 글별 조회수 집계이며 방문 경로·섹션 체류 시간을 저장하지 않는다. 기존 조회수와 새 분석의 지표 정의를 별도로 표시한다.

| 접근 | 장점 | 제약 | 결정 |
|---|---|---|---|
| 자체 수집 + Supabase | 기업 링크, 세션 상세, 기존 관리자 화면을 함께 설계 가능 | 수집 정확도·보존·조회 구현 필요 | 권장 |
| 기존 GA 확장 | 일반 트래픽 분석에 활용 가능 | 원하는 관리자 세션 상세를 만들려면 추가 연동 필요 | 보조 지표로 유지 |
| 외부 행동 분석 서비스 | 시각적 행동 분석 도구를 도입 가능 | 외부 데이터 전송과 별도 운영 설정 발생 | 1차 범위에서 제외 |

## 2. 기업 담당자 열람을 어떻게 해석할 것인가

관리자에서 회사명·지원 직무·제출일·메모를 입력하고 `https://사이트주소/?ref=<무작위토큰>` 링크를 발급한다. 회사명이나 이메일을 URL에 넣지 않는다. 토큰은 128비트 이상의 난수로 만든다.

- 회사별뿐 아니라 지원 건별로 링크를 발급한다. 해당 링크로 발생한 방문과 프로젝트 열람을 묶어 보여 준다.
- 기본 표시는 **“A사 제출 링크에서 방문 발생”**이다. “A사 인사담당자 확인 완료”로 표현하지 않는다.
- 단순 접속, 활동 관측, 자동화 의심을 구분한다. 활동 관측은 활성 체류 10초 이상 또는 스크롤·클릭 발생으로 정의한다. 이것도 사람임을 증명하지는 않는다.
- 링크를 전달받은 제3자, 채용 플랫폼의 미리보기·보안 검사도 방문할 수 있다. 자동화 필터는 의심 사유를 표시하고 완전 차단이라고 설명하지 않는다.
- 일반 URL 방문은 “출처 미확인”으로 저장한다. IP로 회사나 개인을 확정하는 기능은 만들지 않는다.
- 링크가 제거되거나 수집이 차단된 방문, 도입 전 방문은 복원할 수 없다. “기록 없음”은 “열람하지 않음”을 뜻하지 않는다.
- 다른 기업 토큰으로 들어오면 새 세션을 시작해 이전 기업의 기록과 섞이지 않게 한다. 토큰 없이 재방문하면 과거 기업 귀속을 자동으로 이어 붙이지 않는다.

## 3. 수집 항목과 시간의 정의

| 항목 | 저장·표시 방식 |
|---|---|
| 방문 | 서버 기준 시작/마지막 수신 시각, 세션 ID, 첫 경로, 제출 링크 ID |
| 브라우저 구분 | 동의 후 생성한 무작위 ID로 동일 브라우저의 재방문 추정; 개인 수로 표현하지 않음 |
| 유입 | referrer의 origin만 저장, query/hash 제거; 허용한 UTM 값만 길이 제한 후 저장 |
| 환경 | 모바일/데스크톱/태블릿, 브라우저 계열; 원문 User-Agent는 영구 보관하지 않음 |
| 페이지 | 정규화한 경로, 페이지별 방문 ID, 최대 스크롤 깊이 |
| 섹션 | 노출 여부, 진입 횟수, 화면 노출 시간, 활성 체류 추정 시간 |
| 프로젝트 | 프로젝트 ID, 모달 또는 상세 페이지, 열림/닫힘, 활성 체류 시간 |
| 주요 클릭 | GitHub·블로그·이메일 등 미리 정한 목적지 키; 임의 URL이나 입력 내용 수집 금지 |

### 시간과 스크롤 계산 규칙

1. 시간은 `performance.now()` 차이로 계산한다. 화면이 숨겨지면 즉시 중단한다. 서버 수신 시각과 실제 행동 시각은 구분한다.
2. 동시에 보이는 섹션 중 화면과 겹친 면적이 가장 큰 하나를 대표 섹션으로 선정한다. 동률이면 기존 대표를 유지하고 초기 동률은 DOM 순서로 정한다. 긴 섹션 전체의 50% 노출을 조건으로 삼지 않는다.
3. 대표 섹션의 화면 노출 시간과 활성 체류 시간을 따로 집계한다. 활성 체류는 최초 표시 또는 마지막 스크롤·포인터·키보드·터치 활동 이후 60초까지만 인정한다. 긴 정독은 과소 추정될 수 있음을 지표 설명에 표시한다. 입력 값·키 값은 저장하지 않는다.
4. 프로젝트 모달이 열리면 배경 섹션 시간을 멈추고 모달에 귀속한다. 모달 자체 스크롤을 별도로 측정한다.
5. 페이지 활성 시간과 섹션 시간은 서로 더하는 지표가 아니다. 섹션 합계는 페이지 활성 시간 이하가 되게 한다. 여러 탭의 세션 시간을 합쳐 한 사람의 독서 시간으로 표시하지 않는다.
6. 스크롤 깊이는 `scrollTop / (scrollHeight - clientHeight)`의 0~100% 제한 값이다. 스크롤이 필요 없는 페이지는 100%로 표시하되 “짧은 페이지”로 구분한다. 이미지 로딩·레이아웃 변경 시 재계산하며 최대값과 25/50/75/90/100% 첫 도달만 저장한다.
7. 스크롤마다 서버 요청을 보내지 않는다. 위치 계산은 최대 200ms 간격으로 제한하고, 15초마다 변경분을 묶어 전송한다. 페이지 이동, 모달 닫힘, 숨김 시에도 전송한다.
8. 일반 전송은 fetch, 마지막 전송은 `sendBeacon`을 사용한다. 요청당 16KiB·50개 이벤트 이내로 분할한다. Beacon의 true는 서버 저장 확인이 아니므로 중복 허용 전송과 DB 중복 제거를 사용한다.
9. 탭마다 세션을 분리하고 30분 비활동 뒤 새 세션을 시작한다. 새 탭 복제 시 ID 충돌도 피한다. 경로 변경마다 새 페이지 방문 ID를 만들고 bfcache 복귀·React Strict Mode에서 리스너/타이머가 중복되지 않게 한다.
10. 정상 환경의 15초 전송 간격은 종료 시 손실을 줄이기 위한 값이다. 모바일 강제 종료·오프라인·차단에서는 더 큰 누락이 생길 수 있다.

노출 감지에는 Intersection Observer를 사용하고 탭 상태는 Page Visibility로 별도 확인한다. Intersection Observer만으로는 탭 전환을 반영하지 못한다. [MDN 노출 시간 측정](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API/Timing_element_visibility)

종료 전송은 visibilitychange를 우선 사용하고 pagehide를 보완한다. unload 의존은 피한다. [MDN sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)

## 4. 데이터·API 설계

| 테이블 | 주요 필드와 용도 |
|---|---|
| `analytics_links` | id, token_hash, company_label, position, submitted_at, note, disabled_at; 토큰 원문은 생성 응답에서만 노출 |
| `analytics_sessions` | id, browser_id(nullable), link_id(nullable), started_at, last_received_at, device_type, browser_family, source_origin, quality_flags |
| `analytics_page_views` | id, session_id, path, started_at, last_received_at; 페이지별 조회와 상세 연결 |
| `analytics_batches` | page_view_id, sequence, received_at; 복합 유일키로 재시도 중복 제거 |
| `analytics_events` | batch_id, ordinal, type, section_key/project_id/target_key, elapsed_ms, visible_ms, active_ms, scroll_depth; 허용된 타입별 필드만 저장 |

- 이벤트 타입: `page_start`, `exposure_delta`, `scroll_state`, `interaction`, `region_enter`, `project_open`, `project_close`, `outbound_click`. 노출 델타의 누적합과 최대 스크롤로 화면용 집계를 만든다.
- 배치 삽입과 이벤트 기록은 하나의 DB 트랜잭션으로 처리한다. 동일 배치는 성공 응답하되 다시 더하지 않는다. 순서가 뒤바뀌어 도착해도 합계가 유지되게 한다.
- 인덱스: sessions(started_at), sessions(link_id, started_at), page_views(session_id), events(batch_id), batches(page_view_id, sequence unique).
- 서버 전용 `pg` 연결을 `lib/analytics/db.ts`에 둔다. 기존 `SUPABASE_DB_URL` 설정 방식을 참고하되 internal-sync 도메인 모듈에 의존하지 않는다. 연결 풀은 작게 제한하고 운영 연결 방식에 맞춰 검증한다.
- 테이블은 RLS 활성화, anon의 직접 읽기·쓰기 금지, authenticated는 `public.is_admin()` 조건으로만 접근한다. pg 경로의 권한은 RLS에 의존하지 않고 API와 서버 쿼리에서도 검사한다. [Supabase RLS 문서](https://supabase.com/docs/guides/database/postgres/row-level-security)

| API | 계약 |
|---|---|
| `POST /api/analytics/session` | 동의 후 {requestId, ref?, browserId?, path, sourceOrigin?, utm?}를 검증하고 {sessionId, ingestToken, expiresAt} 반환; 서버는 ref 해시로 회사 귀속 결정 |
| `POST /api/analytics/events` | {sessionId, ingestToken, pageViewId, path, pageStartedAt, sequence, events} 수신; 서명·기한·허용 경로·크기·수치 검증 후 204 |
| `GET /api/admin/analytics` | 관리자만; from/to/linkId/cursor 필터, 요약과 50개 방문 페이지 반환 |
| `GET /api/admin/analytics/sessions/[id]` | 관리자만; 페이지·섹션·프로젝트별 기록 반환 |
| `GET/POST /api/admin/analytics/links` | 관리자만; 목록 및 링크 발급 |
| `PATCH /api/admin/analytics/links/[id]` | 관리자만; 라벨·메모 수정 및 비활성화 |
| `DELETE /api/admin/analytics/links/[id]` | 관리자만; 라벨·메모 삭제, 기존 세션 귀속은 null로 유지 |
| `DELETE /api/admin/analytics/sessions/[id]` | 관리자만; 해당 방문과 하위 데이터 삭제 |

수집 API는 인증 없는 방문을 받으므로 동일 출처 확인, 콘텐츠 타입 제한, Zod strict schema, 음수 시간·100% 초과 스크롤 거부가 필요하다. ingestToken은 세션 ID·만료시각을 서버 비밀키로 서명하고 DB 세션 유효성을 함께 확인한다. 공개 API의 완전한 위조 방지를 보장하지는 않는다.

초기 제한은 세션당 분당 10배치, 세션 생성은 출처 IP의 일 단위 HMAC 키당 분당 30회로 둔다. 다중 서버에서도 동작하도록 DB 원자 카운터를 사용하고 24시간 뒤 삭제한다. 원문 IP는 분석 테이블에 저장하지 않는다. 신뢰할 프록시 헤더는 실제 배포 환경에서 검증한다. 잘못된 입력 400, 초과 크기 413, 속도 제한 429, 일시 저장 실패 503; 클라이언트는 503/네트워크 실패만 제한적으로 재시도하고 429는 Retry-After를 따른다.

## 5. 관리자 화면

`/admin/analytics`에 기존 관리자 스타일로 구현하고 콘텐츠·블로그 관리자 메뉴의 데스크톱/모바일 양쪽에 진입점을 둔다.

- 상단: 기간별 세션 수, 브라우저 수(추정), 제출 링크별 활동 관측 수, 세션 활성 시간 중앙값.
- 필터: 오늘/7일/30일/직접 기간, 제출 링크, 기기, 자동화 의심 포함 여부. 저장 UTC, 표시 Asia/Seoul.
- 방문 목록: 회사 제출 라벨, 첫 방문/마지막 수신, 활성 시간, 최대 스크롤, 프로젝트 열람 수, 관측 품질 표시.
- 상세: `홈 → Projects → 프로젝트 모달 → GitHub 클릭` 순서와 섹션별 노출/활성 시간 막대. 경로별 스크롤 깊이를 구분한다.
- 링크 관리: 회사·직무·제출일·메모 입력, 링크 생성/복사, 비활성화. 재복사가 필요하면 새 링크를 발급하는 UX를 명시한다. 링크 삭제 시 기존 방문은 출처 미확인으로 전환한다.
- 0건, 조회 실패, 아직 로딩 중인 상태를 분리한다. 데이터 누락 가능성을 지표 도움말에서 설명한다.
- 예시: `A사 / 프론트엔드 지원 · 활동 관측 · 활성 2분 18초 · 최대 82% · ERP 프로젝트 54초`. 예시는 테스트 데이터이며 실제 방문이 아니다.

## 6. 수집 선택과 운영 기본값

기본 제안은 공개 페이지에서 수집 목적·항목·90일 보존을 짧게 설명하고 방문 분석 허용/거절을 선택하게 하는 것이다. 선택 전에는 분석 식별자 생성·분석 API 전송을 하지 않는다. 회사 링크도 메모리에서만 임시 보유한다. 거절해도 포트폴리오 이용은 가능하다. 푸터에서 선택 변경을 제공한다. 이는 제품 설계 기본값이며 법적 적합성을 확정하는 문서가 아니다.

- 동의 철회 시 수집기 중단·대기열 폐기·브라우저 분석 ID 제거. 관리자에서 기존 세션 삭제 가능.
- 기존 GA가 활성화되어 있다면 같은 선택을 따르도록 로딩 위치/방식을 조정하고 ref 토큰이 page_location으로 전송되지 않게 한다. 기존 블로그 조회수도 수집 선택과 적용 범위를 명확히 맞춘다.
- 페이지 진입 시 토큰을 메모리로 옮기고 주소에서 제거한다. 동의 후에만 서버에 보내 세션과 연결한다. 방문자별 토큰을 정적 HTML이나 캐시 결과에 삽입하지 않는다. 요청 경로/query가 운영 로그에 남는 범위도 점검한다.
- 원문 IP, 정확한 위치, 이메일, 입력 텍스트, 화면 녹화, 브라우저 지문은 수집하지 않는다.
- 상세 기록 90일 보존, 매일 만료 세션과 종속 이벤트 일괄 삭제. 제출 링크 라벨은 관리자가 삭제할 때까지 유지하되 보존 기간 밖 행동 통계는 남기지 않는 초기 범위로 한다.
- 관리자 로그인 사용자의 공개 페이지 방문과 로컬/미리보기 환경은 기본 제외한다. QA 모드에서는 별도 표시된 테스트 세션을 허용한다.
- 분석 실패가 페이지 렌더링·스크롤·모달 동작을 막지 않게 한다. 전역 수집 중지 환경변수를 둔다. 중지 후에도 기록 조회·정리 작업은 유지한다.

## 8. 완료 기준과 우선순위

1차 완료는 **기업별 링크 발급 → 방문/섹션/프로젝트 기록 저장 → 관리자 조회**가 실제 브라우저에서 연결되는 시점이다. 섹션별 체류·스크롤은 1차 필수 범위다. 화면 녹화, 클릭 좌표 히트맵, IP 기업 추정, 자동 알림, CSV 내보내기는 후속 범위로 둔다.

완료 검증 예: 테스트용 A사 링크로 방문해 Projects에서 20초, 프로젝트 모달에서 30초 머문 뒤 GitHub를 클릭한다. 관리자에서 A사 제출 링크, 각 영역의 활성 시간, 최대 스크롤, 프로젝트 및 클릭 기록이 나타나야 한다. 숨긴 탭의 대기 시간과 재전송 배치는 집계에 추가되지 않아야 한다.

## 9. 상세 구현에서 확정한 계약

- 원래 6단계 개요를 10개 실행 작업으로 세분화한다. `analytics_events`에는 허용 타입별 JSONB payload와 단조 증가 `at_ms`를 저장한다. 시간 payload는 startMs/endMs/visibleMs/activeMs를 포함한다.
- `exposure_delta`는 page와 section/project 영역별로 구분한다. 페이지 합계는 page 이벤트만 사용하고 section/project는 상세 분해에만 사용한다. 모든 영역이 보였는지는 `region_enter`로, 대표 영역의 시간은 exposure로 구분한다.
- `scroll_state`는 최대 깊이와 처음 도달한 milestone 배열, 짧은 페이지 여부, page/project 범위를 보낸다. 사용자 `interaction`은 별도 기록해 자동 레이아웃 변화를 활동으로 세지 않는다.
- 배치에는 항상 path와 pageStartedAt을 포함해 page_start 배치가 늦거나 누락돼도 페이지를 생성할 수 있게 한다. 페이지와 세션의 소유 관계는 서버에서 확인한다.
- 세션 생성 requestId와 배치(pageViewId, sequence)는 재시도 식별자다. 동일 키의 다른 본문은 409로 거부한다. 서버는 본문 해시로 충돌을 검증한다.
- 페이지 ID·세션 자격증명은 메모리에만 유지한다. 전체 새로고침과 새 탭은 새 세션으로 취급하고 같은 브라우저 ID로 재방문을 묶는다. SPA 이동·bfcache 복귀는 30분 이내면 세션 유지, 페이지 방문은 새 ID를 발급한다.
- 삭제한 세션은 90일간 requestId 해시 tombstone만 보존해 지연된 생성/전송 요청으로 복구되지 않게 한다. 행동 데이터는 남기지 않는다.
- 서버 수집 허용 조건을 확인하는 `/api/analytics/config`를 추가한다. 이 요청은 분석 기록이나 식별자를 생성하지 않으며 관리자·환경·수집 중지 상태를 판정한다.
- 보존 작업은 Supabase Cron의 일일 SQL 작업으로 확정한다. SQL 실행에는 별도 HTTP 키를 쓰지 않는다. pg_cron 활성화와 실행 기록 확인은 운영 수집 활성화의 선행 조건이다.
- 식별자나 선택을 기록하지 못하는 저장소 환경에서는 선택을 메모리에서 유지하고 새 문서에서 다시 선택한다. browserId는 null로 보내 방문 수와 구분한다.
- 동의 철회는 향후 수집을 멈추며 이미 전송한 기록은 소급 취소하지 않는다. GA가 이미 로드된 문서는 비활성화·선택 저장·URL 정리 후 새로고침해 태그를 제거한다.

Supabase Cron은 SQL 또는 DB 함수를 직접 예약 실행한다. [공식 Cron 문서](https://supabase.com/docs/guides/cron/quickstart)

GA는 선택 전 태그 자체를 로드하지 않는 basic 방식으로 통합한다. 단순 denied 설정만으로 네트워크 전송이 전혀 없다고 가정하지 않는다. [Google consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
