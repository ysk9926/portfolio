# 방문 분석 운영

## 관리자 사용

`/admin/analytics` → **제출 링크**에서 회사·지원 직무·제출일을 입력하고 링크를 발급한다. URL 원문은 발급 직후 한 번만 표시하므로 복사해 보관한다. 재발급한 링크는 별도 제출 건이다.

**방문 기록**에서 기간·회사 링크·기기로 조회하고 상세 보기에서 페이지, 섹션, 프로젝트별 활성 체류와 클릭 순서를 확인한다. 기록은 방문자가 수집을 허용한 이후부터 쌓인다. 링크 방문은 해당 회사 담당자의 신원이나 독해를 증명하지 않으며, 차단·거절·자동 미리보기·공유에 따라 누락 또는 오인 가능성이 있다.

세션은 문서/탭 단위다. 새로고침과 새 탭은 새 세션이며, 동의 후 생성한 무작위 browserId로 브라우저 수를 추정한다. 30분 활동 없음 또는 24시간 경과 뒤 새 세션을 만든다. 전체 활성 시간은 page 이벤트만 합산하며 섹션·모달 시간을 다시 더하지 않는다. 기기·브라우저 계열은 User-Agent에서 축약하고 원문은 분석 테이블에 저장하지 않는다.

## 서버 설정

| 설정 | 설명 |
|---|---|
| `SUPABASE_DB_URL` | 서버 전용 Postgres 연결. 기존 포트폴리오와 동일 Supabase 프로젝트 |
| `SITE_URL` | 실제 공개 사이트 origin. 수집 및 관리자 변경 요청 Origin 검사에 사용 |
| `ANALYTICS_ENABLED` | `true`면 운영에서 수집 허용. 기본 비활성 |
| `ANALYTICS_SIGNING_SECRET` | 32바이트 이상 난수. 수집 세션 서명용 |
| `ANALYTICS_RATE_LIMIT_SECRET` | 별도 32바이트 이상 난수. IP의 일 단위 제한 키용 |
| `VERCEL_ENV` / `APP_ENV` | `production` 환경에서만 기본 수집. Vercel은 자동 설정 |
| `ANALYTICS_QA_MODE` | 비운영에서만 테스트 수집 허용. 기록에 is_test=true를 강제 |
| `ANALYTICS_TEST_DB_URL` | 로컬 통합 테스트 전용 DB. 운영과 같으면 테스트 거부 |

비밀값에는 NEXT_PUBLIC 접두사를 사용하지 않는다. 수집기는 정적 공개 HTML에 붙고, `/api/analytics/config`에서 서버 상태를 확인한다. 설정 조회는 방문 기록이나 식별자를 생성하지 않는다. 60초마다 상태를 갱신하며 환경값 자체의 변경은 호스팅 플랫폼의 적용/재배포 정책을 따른다. Vercel에서 환경변수 수정만으로 기존 배포가 즉시 바뀌지는 않는다.

Vercel ingress가 제공한 `x-vercel-forwarded-for`만 속도 제한 키에 사용한다. 다른 호스팅 환경에서는 ingress의 신뢰 경계를 검증한 뒤 해당 코드를 조정한다. 원문 IP 대신 날짜별 HMAC만 24시간 보관한다.

## Google Analytics

현재 기능은 자체 수집만으로 완결된다. 기존 GA ID가 없는 환경에서는 Google에 데이터를 전송하지 않는다.

GA를 함께 사용할 때는 GA 관리 화면의 Enhanced Measurement에서 **브라우저 기록 변경에 따른 자동 페이지뷰**를 먼저 비활성화하고 `ANALYTICS_GA_MANUAL_PAGEVIEWS=true`와 `GA_MEASUREMENT_ID`를 설정한다. 이 확인값이 없으면 GA는 로드하지 않는다. 코드에서는 수집 허용 후에만 태그를 로드하고, query/hash와 referrer를 제거한 수동 페이지뷰를 전송한다. 이 조건은 제출 토큰이 자동 history 이벤트에 섞이는 것을 막기 위한 것이다. 동의 철회 시 태그를 비활성화하고 문서를 새로고침한다. 기존 블로그 조회수도 같은 선택을 따른다.

## 마이그레이션과 보존

1. `202609070001_visitor_analytics.sql`: 분석 테이블 7개, RLS, 보존 함수. SQL 자체가 트랜잭션이며 기존 포트폴리오 테이블은 변경하지 않는다.
2. Supabase에서 pg_cron extension을 활성화한다.
3. `202609070002_visitor_analytics_cron.sql`: `portfolio-analytics-retention`을 매일 UTC 18:00(한국 03:00) 예약한다. extension이 없으면 명시적으로 실패한다.

```sql
select relname, relrowsecurity from pg_class
where relnamespace='public'::regnamespace and relname like 'analytics_%' and relkind='r';
select public.analytics_purge(now(), true); -- 삭제 없이 만료 대상 개수 확인
select jobid, schedule, active from cron.job where jobname='portfolio-analytics-retention';
select status, start_time, end_time, return_message
from cron.job_run_details
where jobid=(select jobid from cron.job where jobname='portfolio-analytics-retention')
order by start_time desc limit 5;
```

90일 이전 시작 세션과 종속 이벤트를 삭제하고, 만료된 제한 키와 삭제 요청 tombstone을 정리한다. 링크 라벨은 별도로 유지하며 관리자 삭제 시 기존 세션은 출처 미확인으로 바뀐다. 방문 삭제 시 남기는 tombstone은 requestId의 해시이며 행동 데이터는 포함하지 않는다.

CLI 수동 정리는 실행 환경에 연결값을 명시한다.

```sh
npm run analytics:purge:dry-run
npm run analytics:purge
```

## 검증

```sh
npm test
npm run lint
npm run build
npm run test:analytics:db
npm run test:e2e:analytics
```

DB 테스트는 로컬 PostgreSQL의 `portfolio_analytics_test`, port 54329에 한정한다. `ANALYTICS_TEST_DB_URL`을 명시해야 하며 운영 URL로 fallback하지 않는다. 로컬 cluster에는 anon/authenticated/service_role, auth.uid(), public.admin_users와 public.is_admin()을 준비한 후 기본 analytics migration을 적용한다. 권한 fixture는 실제 PostgreSQL RLS를 검증한다.

브라우저 테스트의 수집 API는 로컬 DB에 실제 저장한다. 공개 포트폴리오 콘텐츠/로그인 상태 확인은 기존 Supabase의 공개 읽기 경로를 사용할 수 있지만, 운영 Auth 사용자를 만들거나 로그인 정보를 변경하지 않는다. 권한 테스트는 익명 API 거부와 로컬 DB RLS로 분리했다. 관리자 화면은 `tests/fixtures/analytics-admin`의 독립 Next 앱에서 실제 컴포넌트를 렌더하고 API 경계만 fixture로 대체한다. 운영 관리자 인증 우회 코드는 없다.

테스트에 지정한 QA 키는 로컬 테스트 전용이며 운영 키로 사용하지 않는다. mobile WebKit은 에뮬레이션이고 실기기 Safari 검증을 대신한다고 표시하지 않는다.

## 수집 중지

`ANALYTICS_ENABLED=false`를 적용한 배포로 전환한다. API 쓰기가 중단되고 클라이언트는 다음 설정 확인 때 측정을 중단한다. DB 테이블과 관리자 조회는 유지한다. 기존에 이미 발송한 요청, 운영 로그에 남은 요청 URL, 외부 목적지의 로그를 소급 취소하지는 않는다. 원문 ref/query가 포함된 운영 로그는 호스팅 로그 정책에 따라 관리한다.

## 2026-09-07 적용 기록

- 운영 Supabase에 `202609070001`과 `202609070002`를 적용했다. 분석 테이블 7개의 RLS 활성화, anon/authenticated의 purge 실행 불가, 보존 예약 활성화를 SQL로 확인했다.
- pg_cron을 활성화했다. 별도 임시 작업으로 `analytics_purge(now(), true)`의 실제 예약 실행 성공을 확인한 후 임시 예약을 제거했다. 정규 보존 작업은 한국 시각 매일 03:00에 실행한다.
- 운영 Vercel에 DB 연결과 서로 다른 서명/제한 키를 서버 전용 변수로 설정했다. 비밀값은 저장소에 포함하지 않는다. 수집 활성화는 새 운영 배포부터 적용된다.
- 재시도 session API는 최초 요청과 동일하게 HTTP 201을 반환하되 같은 requestId는 같은 세션 한 개만 생성한다. 이벤트 401/410 이후에는 만료 자격 증명을 버리고 새 세션을 생성한다.
- 페이지 최대 스크롤에는 페이지 이벤트만 사용하며 모달의 최대 스크롤은 프로젝트별로 따로 표시한다. 상세 페이지 프로젝트는 해당 페이지의 스크롤을 표시한다.
- 전송 큐는 200개 이벤트 한도에서 가장 오래된 배치 전체를 제거한다. tracker의 짧은 정산 버퍼는 별도로 최대 200개를 보관하며 초과 누락 수를 기록한다. 따라서 이 값은 모든 중간 측정 객체를 포함한 전역 메모리 한도를 뜻하지 않는다.
- 기존 `tests/internal-sync/db.test.ts`의 제네릭 query fixture가 현재 타입 검사에서 실패해 반환 타입을 실제 인터페이스에 맞췄다. 기존 동기화 동작은 변경하지 않았다.
- 관리자 인증 검증은 익명 API 거부, 실제 로컬 DB RLS, 독립 관리자 UI fixture로 나누었다. 운영 관리자 로그인 E2E, 실제 모바일 기기, 장시간 성능 측정은 수행 결과로 주장하지 않는다.

검증 결과: 단위·기존 회귀 테스트 35개, DB 통합 16개 통과. Chromium 공개 흐름 3개와 관리자 UI 1개 통과 후, 개발 중 갱신과 겹친 모바일 설정 클릭 실패는 코드 변경을 멈춘 상태로 WebKit 3개를 다시 실행해 모두 통과했다. ESLint와 프로덕션 빌드도 통과했다. DB 회귀 테스트는 페이지 75%/모달 100%를 독립 집계하는 경우를 포함한다.
