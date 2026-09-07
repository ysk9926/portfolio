import type { Pool, PoolClient } from 'pg';

import { getAnalyticsPool } from './db';
import { decodeSessionCursor, encodeSessionCursor } from './filters';
import type {
  AnalyticsEvent,
  AnalyticsFilter,
  DashboardData,
  Region,
  SessionDetailData,
  SessionRow,
} from './types';

const filteredMetricsCte = `
  with filtered_sessions as (
    select s.*
    from analytics_sessions s
    where s.started_at >= $1::timestamptz
      and s.started_at < $2::timestamptz
      and ($3::uuid is null or s.link_id = $3::uuid)
      and ($4::text is null or s.device = $4::text)
      and ($5::boolean or not s.suspected_bot)
      and ($6::boolean or not s.is_test)
  ), event_metrics as (
    select p.session_id,
      coalesce(sum((e.payload->>'activeMs')::bigint) filter (
        where e.type = 'exposure_delta' and e.payload->'region'->>'kind' = 'page'
      ), 0)::bigint as active_ms,
      coalesce(max((e.payload->>'depth')::double precision) filter (
        where e.type = 'scroll_state' and e.payload->'region'->>'kind' = 'page'
      ), 0)::double precision as max_depth,
      count(e.*) filter (where e.type = 'project_open')::int as project_views,
      coalesce(bool_or(
        (e.type = 'interaction' and e.payload->>'action' in ('scroll', 'click'))
        or e.type = 'outbound_click'
      ), false) as direct_activity
    from analytics_page_views p
    join filtered_sessions s on s.id = p.session_id
    left join analytics_batches b on b.page_view_id = p.id
    left join analytics_events e on e.batch_id = b.id
    group by p.session_id
  ), session_metrics as (
    select s.*,
      coalesce(m.active_ms, 0)::bigint as active_ms,
      coalesce(m.max_depth, 0)::double precision as max_depth,
      coalesce(m.project_views, 0)::int as project_views,
      (coalesce(m.active_ms, 0) >= 10000 or coalesce(m.direct_activity, false)) as observed_activity
    from filtered_sessions s
    left join event_metrics m on m.session_id = s.id
  )`;

type MetricRow = {
  id: string;
  company_label: string | null;
  started_at: Date;
  last_received_at: Date;
  active_ms: string | number;
  max_depth: string | number;
  project_views: number;
  observed_activity: boolean;
  suspected_bot: boolean;
  is_test: boolean;
};

const numberValue = (value: string | number | null | undefined) => Number(value ?? 0);
const iso = (value: Date | string) => value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const sessionRow = (row: MetricRow): SessionRow => ({
  id: row.id,
  companyLabel: row.company_label,
  startedAt: iso(row.started_at),
  lastReceivedAt: iso(row.last_received_at),
  activeMs: numberValue(row.active_ms),
  maxDepth: numberValue(row.max_depth),
  projectViews: numberValue(row.project_views),
  observedActivity: row.observed_activity,
  suspectedBot: row.suspected_bot,
  isTest: row.is_test,
});

const withReadTransaction = async <T>(pool: Pool, run: (client: PoolClient) => Promise<T>) => {
  const client = await pool.connect();
  try {
    await client.query('begin isolation level repeatable read read only');
    const result = await run(client);
    await client.query('commit');
    return result;
  } catch (error) {
    try {
      await client.query('rollback');
    } catch {
      // Preserve the query error.
    }
    throw error;
  } finally {
    client.release();
  }
};

export const getAnalyticsDashboard = async (
  filter: AnalyticsFilter,
  pool: Pool = getAnalyticsPool(),
): Promise<DashboardData> => withReadTransaction(pool, async (client) => {
  const params = [
    filter.from,
    filter.to,
    filter.linkId ?? null,
    filter.device ?? null,
    filter.includeSuspectedBots,
    filter.includeTest,
  ];
  const summaryResult = await client.query<{
    sessions: number;
    browsers: number;
    median_active_ms: string | number | null;
    observed_sessions: number;
  }>(
    `${filteredMetricsCte}
     select count(*)::int as sessions,
       count(distinct browser_id)::int as browsers,
       coalesce(percentile_cont(0.5) within group (order by active_ms), 0) as median_active_ms,
       count(*) filter (where observed_activity)::int as observed_sessions
     from session_metrics`,
    params,
  );
  const summary = summaryResult.rows[0]!;

  const linksResult = await client.query<{
    link_id: string | null;
    company_label: string | null;
    sessions: number;
    observed_sessions: number;
  }>(
    `${filteredMetricsCte}
     select m.link_id, l.company_label,
       count(*)::int as sessions,
       count(*) filter (where m.observed_activity)::int as observed_sessions
     from session_metrics m
     left join analytics_links l on l.id = m.link_id
     group by m.link_id, l.company_label
     order by count(*) desc, l.company_label nulls last, m.link_id nulls last`,
    params,
  );

  const cursor = filter.cursor ? decodeSessionCursor(filter.cursor) : null;
  const sessionsResult = await client.query<MetricRow>(
    `${filteredMetricsCte}
     select m.id, l.company_label, m.started_at, m.last_received_at,
       m.active_ms, m.max_depth, m.project_views, m.observed_activity,
       m.suspected_bot, m.is_test
     from session_metrics m
     left join analytics_links l on l.id = m.link_id
     where ($7::timestamptz is null or (m.started_at, m.id) < ($7::timestamptz, $8::uuid))
     order by m.started_at desc, m.id desc
     limit $9`,
    [...params, cursor?.startedAt ?? null, cursor?.id ?? null, filter.limit + 1],
  );
  const hasMore = sessionsResult.rows.length > filter.limit;
  const sessionRows = sessionsResult.rows.slice(0, filter.limit);
  const last = sessionRows.at(-1);

  return {
    summary: {
      sessions: numberValue(summary.sessions),
      browsers: numberValue(summary.browsers),
      medianActiveMs: numberValue(summary.median_active_ms),
      observedSessions: numberValue(summary.observed_sessions),
    },
    links: linksResult.rows.map((row) => ({
      linkId: row.link_id,
      companyLabel: row.company_label,
      sessions: numberValue(row.sessions),
      observedSessions: numberValue(row.observed_sessions),
    })),
    sessions: sessionRows.map(sessionRow),
    nextCursor: hasMore && last
      ? encodeSessionCursor({ startedAt: iso(last.started_at), id: last.id })
      : null,
  };
});

type DetailEventRow = {
  page_view_id: string;
  path: string;
  client_started_at: Date;
  sequence: string | number | null;
  ordinal: number | null;
  at_ms: string | number | null;
  payload: AnalyticsEvent | null;
};

const regionKey = (region: Region) => JSON.stringify(region);

export const getSessionDetail = async (
  id: string,
  pool: Pool = getAnalyticsPool(),
): Promise<SessionDetailData | null> => withReadTransaction(pool, async (client) => {
  const metricResult = await client.query<MetricRow>(
    `with target as (
       select * from analytics_sessions where id = $1
     ), event_metrics as (
       select p.session_id,
         coalesce(sum((e.payload->>'activeMs')::bigint) filter (
           where e.type = 'exposure_delta' and e.payload->'region'->>'kind' = 'page'
         ), 0)::bigint as active_ms,
         coalesce(max((e.payload->>'depth')::double precision) filter (where e.type = 'scroll_state' and e.payload->'region'->>'kind' = 'page'), 0) as max_depth,
         count(e.*) filter (where e.type = 'project_open')::int as project_views,
         coalesce(bool_or(
           (e.type = 'interaction' and e.payload->>'action' in ('scroll', 'click'))
           or e.type = 'outbound_click'
         ), false) as direct_activity
       from analytics_page_views p
       join target s on s.id = p.session_id
       left join analytics_batches b on b.page_view_id = p.id
       left join analytics_events e on e.batch_id = b.id
       group by p.session_id
     )
     select s.id, l.company_label, s.started_at, s.last_received_at,
       coalesce(m.active_ms, 0)::bigint as active_ms,
       coalesce(m.max_depth, 0)::double precision as max_depth,
       coalesce(m.project_views, 0)::int as project_views,
       (coalesce(m.active_ms, 0) >= 10000 or coalesce(m.direct_activity, false)) as observed_activity,
       s.suspected_bot, s.is_test
     from target s
     left join event_metrics m on m.session_id = s.id
     left join analytics_links l on l.id = s.link_id`,
    [id],
  );
  const metric = metricResult.rows[0];
  if (!metric) return null;

  const eventsResult = await client.query<DetailEventRow>(
    `select p.id as page_view_id, p.path, p.client_started_at,
       b.sequence, e.ordinal, e.at_ms, e.payload
     from analytics_page_views p
     left join analytics_batches b on b.page_view_id = p.id
     left join analytics_events e on e.batch_id = b.id
     where p.session_id = $1
     order by p.client_started_at, e.at_ms nulls last, b.sequence nulls last, e.ordinal nulls last`,
    [id],
  );
  const droppedResult = await client.query<{ dropped_events: string | number }>(
    `select coalesce(sum(b.dropped_events), 0)::bigint as dropped_events
     from analytics_batches b
     join analytics_page_views p on p.id = b.page_view_id
     where p.session_id = $1`,
    [id],
  );

  type PageAccumulator = SessionDetailData['pages'][number] & {
    regionMap: Map<string, SessionDetailData['pages'][number]['regions'][number]>;
  };
  const pageMap = new Map<string, PageAccumulator>();
  const timeline: SessionDetailData['timeline'] = [];
  for (const row of eventsResult.rows) {
    let page = pageMap.get(row.page_view_id);
    if (!page) {
      page = {
        id: row.page_view_id,
        path: row.path,
        startedAt: iso(row.client_started_at),
        activeMs: 0,
        maxDepth: 0,
        regions: [],
        regionMap: new Map(),
      };
      pageMap.set(row.page_view_id, page);
    }
    const event = row.payload;
    if (!event) continue;
    timeline.push({ pageViewId: row.page_view_id, atMs: numberValue(row.at_ms), event });
    if (event.type === 'scroll_state' && event.region.kind === 'page') page.maxDepth = Math.max(page.maxDepth, event.depth);
    if (event.type !== 'exposure_delta' && event.type !== 'region_enter' && event.type !== 'scroll_state') continue;
    const key = regionKey(event.region);
    let region = page.regionMap.get(key);
    if (!region) {
      region = { region: event.region, visibleMs: 0, activeMs: 0, entries: 0, maxDepth: 0 };
      page.regionMap.set(key, region);
      page.regions.push(region);
    }
    if (event.type === 'exposure_delta') {
      region.visibleMs += event.visibleMs;
      region.activeMs += event.activeMs;
      if (event.region.kind === 'page') page.activeMs += event.activeMs;
    } else if (event.type === 'region_enter') {
      region.entries += 1;
    } else {
      region.maxDepth = Math.max(region.maxDepth, event.depth);
    }
  }

  return {
    session: sessionRow(metric),
    pages: [...pageMap.values()].map((page) => ({
      id: page.id,
      path: page.path,
      startedAt: page.startedAt,
      activeMs: page.activeMs,
      maxDepth: page.maxDepth,
      regions: page.regions,
    })),
    timeline,
    droppedEvents: numberValue(droppedResult.rows[0]?.dropped_events),
  };
});
