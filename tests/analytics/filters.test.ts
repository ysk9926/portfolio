import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAnalyticsFilter } from '../../lib/analytics/filters';

test('한국 날짜를 UTC 반열린 구간으로 변환한다', () => {
  const filter = parseAnalyticsFilter(
    new URLSearchParams('from=2026-09-07&to=2026-09-07'),
    new Date('2026-09-07T10:00:00Z'),
  );

  assert.equal(filter.from, '2026-09-06T15:00:00.000Z');
  assert.equal(filter.to, '2026-09-07T15:00:00.000Z');
});

test('기간을 생략하면 한국 날짜 기준 최근 7일을 선택한다', () => {
  const filter = parseAnalyticsFilter(
    new URLSearchParams(),
    new Date('2026-09-07T16:00:00Z'),
  );

  assert.equal(filter.from, '2026-09-01T15:00:00.000Z');
  assert.equal(filter.to, '2026-09-08T15:00:00.000Z');
  assert.equal(filter.includeSuspectedBots, false);
  assert.equal(filter.includeTest, false);
  assert.equal(filter.limit, 50);
});

test('90일을 넘는 기간과 잘못된 날짜를 거부한다', () => {
  assert.throws(
    () => parseAnalyticsFilter(new URLSearchParams('from=2026-01-01&to=2026-04-01'), new Date()),
    /90 days or fewer/,
  );
  assert.throws(
    () => parseAnalyticsFilter(new URLSearchParams('from=2026-02-30&to=2026-03-01'), new Date()),
    /Invalid from/,
  );
});

test('필터 값과 페이지 크기를 엄격하게 검증한다', () => {
  const valid = parseAnalyticsFilter(
    new URLSearchParams('device=mobile&includeSuspectedBots=true&includeTest=1&limit=20'),
    new Date('2026-09-07T10:00:00Z'),
  );
  assert.equal(valid.device, 'mobile');
  assert.equal(valid.includeSuspectedBots, true);
  assert.equal(valid.includeTest, true);
  assert.equal(valid.limit, 20);

  assert.throws(
    () => parseAnalyticsFilter(new URLSearchParams('device=watch'), new Date()),
    /Invalid device/,
  );
  assert.throws(
    () => parseAnalyticsFilter(new URLSearchParams('limit=0'), new Date()),
    (error: unknown) => error instanceof Error
      && error.message === 'Invalid limit'
      && 'status' in error
      && error.status === 400,
  );
});

test('목록 커서는 UUID와 시각이 든 base64url 구조만 허용한다', () => {
  const cursor = Buffer.from(JSON.stringify({
    startedAt: '2026-09-07T00:00:00.000Z',
    id: '11111111-1111-4111-8111-111111111111',
  })).toString('base64url');
  const filter = parseAnalyticsFilter(
    new URLSearchParams(`cursor=${cursor}`),
    new Date('2026-09-07T10:00:00Z'),
  );
  assert.equal(filter.cursor, cursor);

  assert.throws(
    () => parseAnalyticsFilter(new URLSearchParams('cursor=not-json'), new Date()),
    /Invalid cursor/,
  );
});
