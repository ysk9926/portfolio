import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { purgeAnalytics } from '../../scripts/analytics/purge';
import { makeBatch, makeSessionInput } from './fixtures';
import { openAnalyticsTestDatabase } from './setup';

test('dry-run은 변경하지 않고 실제 보존 작업은 90일 경계 밖 데이터만 삭제한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const oldAt = new Date(+now - 91 * 24 * 60 * 60 * 1_000);
  const recentAt = new Date(+now - 89 * 24 * 60 * 60 * 1_000);
  const sessionIds: string[] = [];
  const rateKeys = [`expired:${crypto.randomUUID()}`, `future:${crypto.randomUUID()}`];
  const tombstoneHash = createHash('sha256').update(crypto.randomUUID()).digest('hex');
  let linkId: string | undefined;
  try {
    const link = await db.repository.createLink({
      companyLabel: '보존 링크', position: '', submittedAt: null, note: '',
    }, createHash('sha256').update(crypto.randomUUID()).digest('hex'), now);
    linkId = link.id;
    const oldSession = await db.repository.createSession(makeSessionInput(), {
      device: 'unknown', browserFamily: 'unknown', suspectedBot: false, isTest: true,
    }, oldAt);
    const recentSession = await db.repository.createSession(makeSessionInput(), {
      device: 'unknown', browserFamily: 'unknown', suspectedBot: false, isTest: true,
    }, recentAt);
    sessionIds.push(oldSession.id, recentSession.id);
    await db.repository.insertBatch(makeBatch(oldSession.id, {
      pageStartedAt: oldAt.toISOString(),
    }), new Date(+oldAt + 1_000));
    await db.pool.query(
      `insert into analytics_rate_limits (key,window_start,count,expires_at)
       values ($1,$3,1,$3),($2,$3,1,$4)`,
      [rateKeys[0], rateKeys[1], new Date(+now - 1), new Date(+now + 1_000)],
    );
    await db.pool.query(
      'insert into analytics_deleted_requests (request_hash,expires_at) values ($1,$2)',
      [tombstoneHash, new Date(+now - 1)],
    );

    assert.deepEqual(await purgeAnalytics(db.pool, now, true), {
      sessions: 1, rateLimits: 1, tombstones: 1,
    });
    assert.equal((await db.pool.query('select 1 from analytics_sessions where id = $1', [oldSession.id])).rows.length, 1);

    assert.deepEqual(await purgeAnalytics(db.pool, now, false), {
      sessions: 1, rateLimits: 1, tombstones: 1,
    });
    assert.equal((await db.pool.query('select 1 from analytics_sessions where id = $1', [oldSession.id])).rows.length, 0);
    assert.equal((await db.pool.query('select 1 from analytics_events e join analytics_batches b on b.id=e.batch_id join analytics_page_views p on p.id=b.page_view_id where p.session_id=$1', [oldSession.id])).rows.length, 0);
    assert.equal((await db.pool.query('select 1 from analytics_sessions where id = $1', [recentSession.id])).rows.length, 1);
    assert.equal((await db.pool.query('select 1 from analytics_links where id = $1', [link.id])).rows.length, 1);
    assert.equal((await db.pool.query('select 1 from analytics_rate_limits where key = $1', [rateKeys[1]])).rows.length, 1);
  } finally {
    for (const id of sessionIds) await db.repository.deleteSession(id, now);
    await db.pool.query('delete from analytics_rate_limits where key = any($1::text[])', [rateKeys]);
    await db.pool.query('delete from analytics_deleted_requests where request_hash = $1', [tombstoneHash]);
    if (linkId) await db.repository.deleteLink(linkId);
    await db.close();
  }
});
