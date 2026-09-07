import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { getAnalyticsDashboard, getSessionDetail } from '../../lib/analytics/queries';
import type { AnalyticsEvent, AnalyticsFilter } from '../../lib/analytics/types';
import { makeBatch, makeSessionInput } from './fixtures';
import { openAnalyticsTestDatabase } from './setup';

const filter = (overrides: Partial<AnalyticsFilter> = {}): AnalyticsFilter => ({
  from: '2026-09-06T15:00:00.000Z',
  to: '2026-09-07T15:00:00.000Z',
  includeSuspectedBots: false,
  includeTest: false,
  limit: 50,
  ...overrides,
});

const exposure = (
  region: Extract<AnalyticsEvent, { type: 'exposure_delta' }>['region'],
  activeMs: number,
): AnalyticsEvent => ({
  type: 'exposure_delta', region, atMs: activeMs,
  startMs: 0, endMs: activeMs, visibleMs: activeMs, activeMs,
});

test('대시보드는 page 노출만 합산하고 세션별 합계의 중앙값을 계산한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T00:00:00Z');
  const sessionIds: string[] = [];
  let linkId: string | undefined;
  try {
    await db.pool.query("insert into projects(id,title) values(1,'분석 대상 프로젝트') on conflict(id) do update set title=excluded.title");
    const rawRef = crypto.randomUUID().replaceAll('-', '');
    const link = await db.repository.createLink({
      companyLabel: 'A사', position: 'Backend', submittedAt: null, note: '',
    }, createHash('sha256').update(rawRef).digest('hex'), now);
    linkId = link.id;

    const first = await db.repository.createSession(makeSessionInput({
      browserId: crypto.randomUUID(), ref: rawRef,
    }), {
      device: 'desktop', browserFamily: 'Chromium', suspectedBot: false, isTest: false,
    }, now);
    sessionIds.push(first.id);
    await db.repository.insertBatch(makeBatch(first.id, {
      pageStartedAt: '2026-09-07T00:00:00.000Z',
      droppedEvents: 2,
      events: [
        exposure({ kind: 'page' }, 50_000),
        exposure({ kind: 'section', key: 'projects' }, 20_000),
        exposure({ kind: 'project', projectId: 1, surface: 'modal' }, 30_000),
        { type: 'region_enter', region: { kind: 'section', key: 'projects' }, atMs: 1_000 },
        { type: 'scroll_state', region: { kind: 'page' }, depth: 75, milestones: [25, 50, 75], shortPage: false, atMs: 49_000 },
        { type: 'scroll_state', region: { kind: 'project', projectId: 1, surface: 'modal' }, depth: 100, milestones: [25,50,75,90,100], shortPage: false, atMs: 49_100 },
        { type: 'project_open', projectId: 1, surface: 'modal', atMs: 20_000 },
        { type: 'outbound_click', target: 'github', projectId: 1, atMs: 49_500 },
      ],
    }), new Date(+now + 50_000));
    await db.repository.insertBatch(makeBatch(first.id, {
      pageViewId: crypto.randomUUID(),
      path: '/blog',
      pageStartedAt: '2026-09-07T00:01:00.000Z',
      events: [exposure({ kind: 'page' }, 10_000), exposure({kind:'project',projectId:1,surface:'detail'},10_000), {type:'project_open',projectId:1,surface:'detail',atMs:0}, {type:'project_open',projectId:1,surface:'detail',atMs:1_000}, {type:'outbound_click',projectId:1,target:'demo',atMs:5_000}],
    }), new Date(+now + 70_000));

    const second = await db.repository.createSession(makeSessionInput({ browserId: crypto.randomUUID() }), {
      device: 'mobile', browserFamily: 'Safari', suspectedBot: false, isTest: false,
    }, new Date(+now + 3_600_000));
    sessionIds.push(second.id);
    await db.repository.insertBatch(makeBatch(second.id, {
      pageStartedAt: '2026-09-07T01:00:00.000Z',
      events: [exposure({ kind: 'page' }, 20_000)],
    }), new Date(+now + 3_620_000));

    const dashboard = await getAnalyticsDashboard(filter(), db.pool);
    assert.deepEqual(dashboard.summary, {
      sessions: 2,
      browsers: 2,
      medianActiveMs: 40_000,
      observedSessions: 2,
    });
    assert.equal(dashboard.sessions.find((row) => row.id === first.id)?.activeMs, 60_000);
    assert.equal(dashboard.sessions.find((row) => row.id === first.id)?.projectViews, 3);
    assert.equal(dashboard.sessions.find((row) => row.id === first.id)?.maxDepth, 75);
    assert.deepEqual(dashboard.projects, [{projectId:1,title:'분석 대상 프로젝트',sessions:1,views:3,modalViews:1,detailViews:2,activeMs:40_000,averageActiveMs:40_000,githubClicks:1,demoClicks:1}]);
    assert.deepEqual((await getAnalyticsDashboard(filter({device:'mobile'}), db.pool)).projects, []);
    assert.deepEqual((await getAnalyticsDashboard(filter({linkId:link.id}), db.pool)).projects, dashboard.projects);
    const firstPage = await getAnalyticsDashboard(filter({limit:1}), db.pool);
    assert.ok(firstPage.nextCursor);
    assert.deepEqual((await getAnalyticsDashboard(filter({limit:1,cursor:firstPage.nextCursor}), db.pool)).projects, dashboard.projects);
    assert.deepEqual(
      dashboard.links.find((row) => row.linkId === link.id),
      { linkId: link.id, companyLabel: 'A사', sessions: 1, observedSessions: 1 },
    );

    const detail = await getSessionDetail(first.id, db.pool);
    assert.ok(detail);
    assert.equal(detail.session.activeMs, 60_000);
    assert.equal(detail.pages.length, 2);
    assert.equal(detail.pages[0]?.activeMs, 50_000);
    assert.equal(detail.pages[0]?.maxDepth, 75);
    assert.equal(detail.pages[0]?.regions.find((row) => row.region.kind === "project")?.maxDepth, 100);
    assert.equal(detail.pages[0]?.regions.find((row) => row.region.kind === 'section')?.activeMs, 20_000);
    assert.equal(detail.droppedEvents, 2);
    assert.equal(detail.timeline.at(-1)?.pageViewId, detail.pages[1]?.id);
  } finally {
    await db.pool.query('delete from projects where id=1');
    for (const id of sessionIds) await db.repository.deleteSession(id, now);
    if (linkId) await db.repository.deleteLink(linkId);
    await db.close();
  }
});

test('자동화 의심·테스트 세션은 기본 제외하고 플래그로 포함한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T02:00:00Z');
  const ids: string[] = [];
  let linkId: string | undefined;
  try {
    const rawRef = crypto.randomUUID().replaceAll('-', '');
    const link = await db.repository.createLink({
      companyLabel: '필터 격리', position: '', submittedAt: null, note: '',
    }, createHash('sha256').update(rawRef).digest('hex'), now);
    linkId = link.id;
    const bot = await db.repository.createSession(makeSessionInput({ ref: rawRef }), {
      device: 'unknown', browserFamily: 'Bot', suspectedBot: true, isTest: false,
    }, now);
    const qa = await db.repository.createSession(makeSessionInput({ ref: rawRef }), {
      device: 'unknown', browserFamily: 'QA', suspectedBot: false, isTest: true,
    }, new Date(+now + 1_000));
    ids.push(bot.id, qa.id);
    for (const id of ids) await db.repository.insertBatch(makeBatch(id, {events:[{type:'project_open',projectId:998,surface:'modal',atMs:0}]}),new Date(+now+2_000));
    await db.repository.insertBatch(makeBatch(qa.id, {events:[{type:'outbound_click',projectId:999,target:'demo',atMs:0}, {type:'outbound_click',target:'github',atMs:1}]}),new Date(+now+2_000));
    assert.deepEqual((await getAnalyticsDashboard(filter({linkId}),db.pool)).projects, []);
    const includedProjects = (await getAnalyticsDashboard(filter({linkId,includeSuspectedBots:true,includeTest:true}),db.pool)).projects;
    assert.equal(includedProjects[0]?.projectId,998);
    assert.equal(includedProjects[0]?.sessions,2);
    assert.equal(includedProjects[0]?.title,'프로젝트 #998');
    assert.equal(includedProjects[1]?.sessions,0);
    assert.equal(includedProjects[1]?.averageActiveMs,0);
    assert.equal(includedProjects[1]?.demoClicks,1);
    assert.equal(includedProjects.length,2);

    assert.equal((await getAnalyticsDashboard(filter({ linkId }), db.pool)).summary.sessions, 0);
    assert.equal((await getAnalyticsDashboard(filter({ linkId, includeSuspectedBots: true }), db.pool)).summary.sessions, 1);
    assert.equal((await getAnalyticsDashboard(filter({ linkId, includeTest: true }), db.pool)).summary.sessions, 1);
    assert.equal((await getAnalyticsDashboard(filter({ linkId, includeSuspectedBots: true, includeTest: true }), db.pool)).summary.sessions, 2);
  } finally {
    for (const id of ids) await db.repository.deleteSession(id, now);
    if (linkId) await db.repository.deleteLink(linkId);
    await db.close();
  }
});

test('세션 목록 cursor는 전체 요약을 바꾸지 않고 다음 페이지를 반환한다', async () => {
  const db = await openAnalyticsTestDatabase();
  const now = new Date('2026-09-07T03:00:00Z');
  const ids: string[] = [];
  try {
    for (let index = 0; index < 3; index += 1) {
      const session = await db.repository.createSession(makeSessionInput(), {
        device: 'desktop', browserFamily: 'Chromium', suspectedBot: false, isTest: false,
      }, new Date(+now + index * 1_000));
      ids.push(session.id);
    }
    const first = await getAnalyticsDashboard(filter({ limit: 2 }), db.pool);
    assert.equal(first.summary.sessions, 3);
    assert.equal(first.sessions.length, 2);
    assert.ok(first.nextCursor);
    const second = await getAnalyticsDashboard(filter({ limit: 2, cursor: first.nextCursor }), db.pool);
    assert.equal(second.summary.sessions, 3);
    assert.equal(second.sessions.length, 1);
    assert.equal(new Set([...first.sessions, ...second.sessions].map((row) => row.id)).size, 3);
  } finally {
    for (const id of ids) await db.repository.deleteSession(id, now);
    await db.close();
  }
});

test('방문 시작 시각은 UTC 반열린 경계를 따르고 빈 결과 중앙값은 0이다', async () => {
  const db = await openAnalyticsTestDatabase();
  const lower = new Date('2026-09-06T15:00:00.000Z');
  const upper = new Date('2026-09-07T15:00:00.000Z');
  const ids: string[] = [];
  try {
    for (const startedAt of [lower, upper]) {
      const session = await db.repository.createSession(makeSessionInput(), {
        device: 'unknown', browserFamily: 'unknown', suspectedBot: false, isTest: false,
      }, startedAt);
      ids.push(session.id);
    }
    const dashboard = await getAnalyticsDashboard(filter(), db.pool);
    assert.equal(dashboard.summary.sessions, 1);
    assert.equal(dashboard.sessions[0]?.id, ids[0]);

    const empty = await getAnalyticsDashboard(filter({
      from: '2026-09-08T15:00:00.000Z',
      to: '2026-09-09T15:00:00.000Z',
    }), db.pool);
    assert.deepEqual(empty.summary, {
      sessions: 0, browsers: 0, medianActiveMs: 0, observedSessions: 0,
    });
    assert.deepEqual(empty.sessions, []);
    assert.deepEqual(empty.links, []);
    assert.deepEqual(empty.projects, []);
    assert.equal(empty.nextCursor, null);
  } finally {
    for (const id of ids) await db.repository.deleteSession(id, upper);
    await db.close();
  }
});
