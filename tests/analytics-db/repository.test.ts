import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from 'pg';

import { AnalyticsError } from '../../lib/analytics/repository';
import { makeBatch, makeSessionInput } from './fixtures';
import { openAnalyticsTestDatabase } from './setup';

const metadata = {
  device: 'unknown' as const,
  browserFamily: 'unknown',
  suspectedBot: false,
  isTest: true,
};

test('requestId 재시도는 같은 세션을 돌려주고 다른 본문은 거부한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const input = makeSessionInput();
  try {
    const first = await db.repository.createSession(input, metadata, now);
    const retry = await db.repository.createSession(input, metadata, new Date(+now + 1_000));
    assert.equal(retry.id, first.id);

    await assert.rejects(
      db.repository.createSession({ ...input, path: '/blog' }, metadata, now),
      (error: unknown) => error instanceof AnalyticsError && error.status === 409,
    );
    await db.repository.deleteSession(first.id, now);
  } finally {
    await db.close();
  }
});

test('같은 배치를 재전송해도 한 번만 저장하고 수신 시각을 늘리지 않는다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  let sessionId: string | undefined;
  try {
    const session = await db.repository.createSession(makeSessionInput(), metadata, now);
    sessionId = session.id;
    const batch = makeBatch(session.id);
    assert.equal(await db.repository.insertBatch(batch, new Date(+now + 15_000)), 'inserted');
    assert.equal(await db.repository.insertBatch(batch, new Date(+now + 16_000)), 'duplicate');

    const result = await db.pool.query<{ count: number; last_received_at: Date }>(
      `select count(b.*)::int as count, max(s.last_received_at) as last_received_at
       from analytics_batches b
       join analytics_page_views p on p.id = b.page_view_id
       join analytics_sessions s on s.id = p.session_id
       where b.page_view_id = $1`,
      [batch.pageViewId],
    );
    assert.equal(result.rows[0]?.count, 1);
    assert.equal(result.rows[0]?.last_received_at.toISOString(), '2026-09-07T00:00:15.000Z');
  } finally {
    if (sessionId) await db.repository.deleteSession(sessionId, now);
    await db.close();
  }
});

test('역순 배치를 저장하지만 같은 sequence의 다른 본문은 409로 거부한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  let sessionId: string | undefined;
  try {
    const session = await db.repository.createSession(makeSessionInput(), metadata, now);
    sessionId = session.id;
    const pageViewId = crypto.randomUUID();
    const later = makeBatch(session.id, { pageViewId, sequence: 1 });
    const earlier = makeBatch(session.id, { pageViewId, sequence: 0 });
    assert.equal(await db.repository.insertBatch(later, new Date(+now + 20_000)), 'inserted');
    assert.equal(await db.repository.insertBatch(earlier, new Date(+now + 25_000)), 'inserted');

    await assert.rejects(
      db.repository.insertBatch({ ...earlier, droppedEvents: 1 }, new Date(+now + 30_000)),
      (error: unknown) => error instanceof AnalyticsError && error.status === 409,
    );
  } finally {
    if (sessionId) await db.repository.deleteSession(sessionId, now);
    await db.close();
  }
});

test('동시에 제출된 중복 배치 중 하나만 삽입된다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  let sessionId: string | undefined;
  try {
    const session = await db.repository.createSession(makeSessionInput(), metadata, now);
    sessionId = session.id;
    const batch = makeBatch(session.id);
    const outcomes = await Promise.all([
      db.repository.insertBatch(batch, new Date(+now + 15_000)),
      db.repository.insertBatch(batch, new Date(+now + 15_000)),
    ]);
    assert.deepEqual(outcomes.sort(), ['duplicate', 'inserted']);
  } finally {
    if (sessionId) await db.repository.deleteSession(sessionId, now);
    await db.close();
  }
});

test('삭제된 세션은 tombstone으로 재생성과 늦은 배치를 막는다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const input = makeSessionInput();
  const session = await db.repository.createSession(input, metadata, now);
  try {
    assert.equal(await db.repository.deleteSession(session.id, new Date(+now + 10_000)), true);
    assert.equal(await db.repository.deleteSession(session.id, new Date(+now + 11_000)), false);
    await assert.rejects(
      db.repository.insertBatch(makeBatch(session.id), new Date(+now + 15_000)),
      (error: unknown) => error instanceof AnalyticsError && error.status === 410,
    );
    await assert.rejects(
      db.repository.createSession(input, metadata, new Date(+now + 20_000)),
      (error: unknown) => error instanceof AnalyticsError && error.status === 410,
    );
  } finally {
    await db.pool.query(
      `delete from analytics_deleted_requests
       where request_hash = encode(digest($1, 'sha256'), 'hex')`,
      [input.requestId],
    );
    await db.close();
  }
});

test('고정 1분 창에서 rate limit을 원자적으로 적용한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const key = `test:${crypto.randomUUID()}`;
  const now = new Date('2026-09-07T00:00:30Z');
  try {
    const outcomes = await Promise.all([
      db.repository.takeRateLimit(key, 2, now),
      db.repository.takeRateLimit(key, 2, now),
      db.repository.takeRateLimit(key, 2, now),
    ]);
    assert.equal(outcomes.filter(Boolean).length, 2);
    assert.equal(await db.repository.takeRateLimit(key, 2, new Date('2026-09-07T00:01:00Z')), true);
  } finally {
    await db.pool.query('delete from analytics_rate_limits where key = $1', [key]);
    await db.close();
  }
});

test('저장 경계에서도 배치당 이벤트 수를 50개로 제한한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const session = await db.repository.createSession(makeSessionInput(), metadata, now);
  try {
    await assert.rejects(
      db.repository.insertBatch(makeBatch(session.id, {
        events: Array.from({ length: 51 }, (_, atMs) => ({ type: 'page_start' as const, atMs })),
      }), new Date(+now + 1_000)),
      (error: unknown) => error instanceof AnalyticsError && error.status === 400,
    );
    const count = await db.pool.query<{ count: number }>(
      `select count(*)::int as count from analytics_page_views where session_id = $1`,
      [session.id],
    );
    assert.equal(count.rows[0]?.count, 0);
  } finally {
    await db.repository.deleteSession(session.id, now);
    await db.close();
  }
});

test('삭제와 requestId 재시도가 겹쳐도 삭제된 세션을 다시 만들지 않는다', { timeout: 5_000 }, async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const input = makeSessionInput();
  const session = await db.repository.createSession(input, metadata, now);
  const blocker = await db.pool.connect();
  const blockerPid = (await blocker.query<{ pid: number }>('select pg_backend_pid() as pid')).rows[0]!.pid;
  const monitor = new Client({ connectionString: process.env.ANALYTICS_TEST_DB_URL });
  await monitor.connect();
  const waitForLockCount = async (minimum: number) => {
    const deadline = Date.now() + 2_000;
    let observed: Array<Record<string, unknown>> = [];
    while (Date.now() < deadline) {
      const result = await monitor.query<Record<string, unknown>>(
        `select pid, state, wait_event_type, wait_event, query from pg_stat_activity
         where datname = current_database()
           and pid not in (pg_backend_pid(), $1)`,
        [blockerPid],
      );
      observed = result.rows;
      if (observed.filter((row) => row.wait_event_type === 'Lock').length >= minimum) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.fail(`Expected ${minimum} analytics session lock waiters: ${JSON.stringify(observed)}`);
  };

  try {
    await blocker.query('begin');
    await blocker.query('select id from analytics_sessions where id = $1 for update', [session.id]);
    const deletion = db.repository.deleteSession(session.id, new Date(+now + 1_000));
    await waitForLockCount(1);
    const retry = db.repository.createSession(input, metadata, new Date(+now + 2_000))
      .then((value) => ({ value, error: null as unknown }))
      .catch((error: unknown) => ({ value: null, error }));
    await waitForLockCount(2);
    await blocker.query('commit');

    assert.equal(await deletion, true);
    const retryResult = await retry;
    assert.equal(
      retryResult.error instanceof AnalyticsError && retryResult.error.status === 410,
      true,
    );
    assert.equal(retryResult.value, null);
    const count = await db.pool.query<{ count: number }>(
      'select count(*)::int as count from analytics_sessions where request_id = $1',
      [input.requestId],
    );
    assert.equal(count.rows[0]?.count, 0);
  } finally {
    await blocker.query('rollback').catch(() => undefined);
    blocker.release();
    await monitor.end();
    const recreated = await db.pool.query<{ id: string }>(
      'delete from analytics_sessions where request_id = $1 returning id',
      [input.requestId],
    );
    await db.pool.query(
      `delete from analytics_deleted_requests
       where request_hash in (
         encode(digest($1, 'sha256'), 'hex'),
         encode(digest('session:' || $2, 'sha256'), 'hex')
       )`,
      [input.requestId, recreated.rows[0]?.id ?? session.id],
    );
    await db.close();
  }
});
