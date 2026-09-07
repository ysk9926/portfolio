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

test('관리자는 같은 링크를 다시 조회하고 기존 링크와 저장된 링크를 함께 사용할 수 있다', async () => {
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

    assert.match(link.shareToken, /^[a-zA-Z0-9_-]{22,64}$/);
    const savedHash = createHash('sha256').update(link.shareToken).digest('hex');
    assert.deepEqual(await db.repository.resolveActiveLink(savedHash), { id: link.id });
    const savedSession = await db.repository.createSession(makeSessionInput({ref: link.shareToken}), metadata, now);
    assert.equal((await db.pool.query('select link_id from analytics_sessions where id=$1',[savedSession.id])).rows[0].link_id, link.id);
    await db.repository.deleteSession(savedSession.id, now);
    const listed = await db.repository.listLinks({ limit: 1 });
    assert.equal(listed.links.some((item) => item.id === link.id), true);
    assert.equal('tokenHash' in listed.links[0]!, false);
    assert.equal(listed.links[0]?.shareToken, link.shareToken);
    assert.equal((await db.repository.listLinks({limit:1})).links[0]?.shareToken, link.shareToken);

    const updated = await db.repository.updateLink(link.id, {
      note: '수정된 메모',
      submittedAt: null,
      disabled: true,
    }, new Date(+now + 1_000));
    assert.equal(updated?.note, '수정된 메모');
    assert.equal(updated?.submittedAt, null);
    assert.equal(updated?.disabledAt, '2099-09-07T00:00:01.000Z');
    assert.equal(await db.repository.resolveActiveLink(tokenHash), null);
    assert.equal(await db.repository.resolveActiveLink(savedHash), null);
    assert.equal(updated?.shareToken, link.shareToken);

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


test('새로 발급한 링크 원문은 관리자 재조회에서도 유지된다', async () => {
  const db = await openAnalyticsTestDatabase();
  const token = crypto.randomUUID().replaceAll('-', '');
  const now = new Date('2099-10-07T00:00:00Z');
  let id: string | undefined;
  try {
    const link = await db.repository.createLink({companyLabel:'저장 링크', position:'', submittedAt:null, note:''},createHash('sha256').update(token).digest('hex'),now,token);
    id = link.id;
    assert.equal(link.shareToken, token);
    assert.equal((await db.repository.listLinks({limit:1})).links[0]?.shareToken, token);
  } finally {
    if(id) await db.repository.deleteLink(id);
    await db.close();
  }
});
