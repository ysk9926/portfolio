import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { makeSessionInput } from './fixtures';
import { openAnalyticsTestDatabase } from './setup';

const metadata = {
  device: 'desktop' as const,
  browserFamily: 'Chromium',
  suspectedBot: false,
  isTest: true,
};

test('링크 원문을 노출하지 않고 생성·조회·수정·비활성화·삭제한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2099-09-07T00:00:00Z');
  const rawToken = crypto.randomUUID().replaceAll('-', '');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  let linkId: string | undefined;
  let sessionId: string | undefined;
  try {
    const link = await db.repository.createLink({
      companyLabel: 'A사',
      position: 'Backend',
      submittedAt: '2026-09-07',
      note: '채용 플랫폼',
    }, tokenHash, now);
    linkId = link.id;
    assert.deepEqual(await db.repository.resolveActiveLink(tokenHash), { id: link.id });

    const listed = await db.repository.listLinks({ limit: 1 });
    assert.equal(listed.links.some((item) => item.id === link.id), true);
    assert.equal('tokenHash' in listed.links[0]!, false);

    const updated = await db.repository.updateLink(link.id, {
      note: '수정된 메모',
      submittedAt: null,
      disabled: true,
    }, new Date(+now + 1_000));
    assert.equal(updated?.note, '수정된 메모');
    assert.equal(updated?.submittedAt, null);
    assert.equal(updated?.disabledAt, '2099-09-07T00:00:01.000Z');
    assert.equal(await db.repository.resolveActiveLink(tokenHash), null);

    await db.repository.updateLink(link.id, { disabled: false }, new Date(+now + 2_000));
    const session = await db.repository.createSession(
      makeSessionInput({ ref: rawToken }),
      metadata,
      now,
    );
    sessionId = session.id;
    const attribution = await db.pool.query<{ link_id: string | null }>(
      'select link_id from analytics_sessions where id = $1',
      [session.id],
    );
    assert.equal(attribution.rows[0]?.link_id, link.id);

    assert.equal(await db.repository.deleteLink(link.id), true);
    linkId = undefined;
    const detached = await db.pool.query<{ link_id: string | null }>(
      'select link_id from analytics_sessions where id = $1',
      [session.id],
    );
    assert.equal(detached.rows[0]?.link_id, null);
  } finally {
    if (sessionId) await db.repository.deleteSession(sessionId, now);
    if (linkId) await db.repository.deleteLink(linkId);
    await db.close();
  }
});
