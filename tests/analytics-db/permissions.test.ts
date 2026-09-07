import assert from 'node:assert/strict';
import test from 'node:test';

import { makeSessionInput } from './fixtures';
import { openAnalyticsTestDatabase } from './setup';

test('일반 authenticated 사용자는 분석 행과 내부 보조 테이블에 접근하지 못한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const session = await db.repository.createSession(makeSessionInput(), {
    device: 'unknown', browserFamily: 'unknown', suspectedBot: false, isTest: true,
  }, now);
  const client = await db.pool.connect();
  try {
    await client.query('begin');
    await client.query('set local role authenticated');
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [crypto.randomUUID()]);
    const hidden = await client.query<{ count: number }>('select count(*)::int as count from analytics_sessions');
    assert.equal(hidden.rows[0]?.count, 0);
    await assert.rejects(
      client.query(
        `insert into analytics_sessions
          (request_id,input_hash,started_at,expires_at,last_received_at,first_path,device,browser_family)
         values ($1,'x',$2,$3,$2,'/','unknown','unknown')`,
        [crypto.randomUUID(), now, new Date(+now + 1_000)],
      ),
      /row-level security policy/,
    );
    await client.query('rollback');

    await client.query('begin');
    await client.query('set local role authenticated');
    await assert.rejects(
      client.query('select * from analytics_rate_limits'),
      /permission denied/,
    );
    await client.query('rollback');

    await client.query('begin');
    await client.query('set local role authenticated');
    await assert.rejects(
      client.query('select * from analytics_purge(now(), true)'),
      /permission denied/,
    );
    await client.query('rollback');
  } finally {
    client.release();
    await db.repository.deleteSession(session.id, now);
    await db.close();
  }
});

test('is_admin 사용자는 RLS를 통과해 분석 행을 조회한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const userId = crypto.randomUUID();
  const session = await db.repository.createSession(makeSessionInput(), {
    device: 'unknown', browserFamily: 'unknown', suspectedBot: false, isTest: true,
  }, now);
  await db.pool.query('insert into admin_users (user_id, email) values ($1,$2)', [userId, `${userId}@example.test`]);
  const client = await db.pool.connect();
  try {
    await client.query('begin');
    await client.query('set local role authenticated');
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    const visible = await client.query<{ id: string }>('select id from analytics_sessions where id = $1', [session.id]);
    assert.equal(visible.rows[0]?.id, session.id);
    await client.query('rollback');
  } finally {
    client.release();
    await db.pool.query('delete from admin_users where user_id = $1', [userId]);
    await db.repository.deleteSession(session.id, now);
    await db.close();
  }
});
