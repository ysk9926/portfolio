import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

import { LIMITS } from './constants';
import type { EventBatch, LinkInput, SessionInput, TrackingLink } from './types';

export interface StoredSession {
  id: string;
  startedAt: Date;
  expiresAt: Date;
  isTest: boolean;
}

export interface SessionMetadata {
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browserFamily: string;
  suspectedBot: boolean;
  isTest: boolean;
}

export interface LinkListOptions {
  limit?: number;
  cursor?: string;
}

export interface LinkPatch extends Partial<LinkInput> {
  disabled?: boolean;
}

export interface AnalyticsRepository {
  createSession(input: SessionInput, meta: SessionMetadata, now: Date): Promise<StoredSession>;
  insertBatch(batch: EventBatch, now: Date): Promise<'inserted' | 'duplicate'>;
  sessionIsActive(id: string, now: Date): Promise<boolean>;
  deleteSession(id: string, now: Date): Promise<boolean>;
  takeRateLimit(key: string, limit: number, now: Date): Promise<boolean>;
  resolveActiveLink(tokenHash: string): Promise<{ id: string } | null>;
  createLink(input: LinkInput, tokenHash: string, now: Date): Promise<TrackingLink>;
  listLinks(options?: LinkListOptions): Promise<{ links: TrackingLink[]; nextCursor: string | null }>;
  updateLink(id: string, input: LinkPatch, now: Date): Promise<TrackingLink | null>;
  deleteLink(id: string): Promise<boolean>;
}

export class AnalyticsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string = 'analytics_error',
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

const canonicalHash = (value: unknown) => hash(JSON.stringify(canonicalize(value)));
const sessionTombstoneHash = (id: string) => hash(`session:${id}`);

const transaction = async <T>(pool: Pool, run: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await run(client);
    await client.query('commit');
    return result;
  } catch (error) {
    try {
      await client.query('rollback');
    } catch {
      // Preserve the original transaction error.
    }
    throw error;
  } finally {
    client.release();
  }
};

type SessionDbRow = {
  id: string;
  started_at: Date;
  expires_at: Date;
  is_test: boolean;
  input_hash?: string;
  last_received_at?: Date;
};

const storedSession = (row: SessionDbRow): StoredSession => ({
  id: row.id,
  startedAt: row.started_at,
  expiresAt: row.expires_at,
  isTest: row.is_test,
});

type LinkDbRow = {
  id: string;
  company_label: string;
  position: string;
  submitted_at: string | null;
  note: string;
  created_at: Date;
  disabled_at: Date | null;
};

const trackingLink = (row: LinkDbRow): TrackingLink => ({
  id: row.id,
  companyLabel: row.company_label,
  position: row.position,
  submittedAt: row.submitted_at,
  note: row.note,
  createdAt: row.created_at.toISOString(),
  disabledAt: row.disabled_at?.toISOString() ?? null,
});

const decodeLinkCursor = (cursor: string) => {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (
      !parsed || Array.isArray(parsed)
      || Object.keys(parsed).length !== 2
      || typeof parsed.createdAt !== 'string'
      || typeof parsed.id !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.id)
    ) throw new Error();
    const createdAt = new Date(parsed.createdAt);
    if (!Number.isFinite(createdAt.getTime()) || createdAt.toISOString() !== parsed.createdAt) throw new Error();
    return { createdAt, id: parsed.id };
  } catch {
    throw new AnalyticsError('Invalid link cursor', 400, 'invalid_cursor');
  }
};

export const createAnalyticsRepository = (pool: Pool): AnalyticsRepository => ({
  async createSession(input, meta, now) {
    return transaction(pool, async (client) => {
      const requestHash = hash(input.requestId);
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [requestHash]);
      const tombstone = await client.query(
        'select 1 from analytics_deleted_requests where request_hash = $1 and expires_at > $2',
        [requestHash, now],
      );
      if (tombstone.rows.length) throw new AnalyticsError('Session was deleted', 410, 'session_deleted');

      const sessionBody = Object.fromEntries(
        Object.entries(input).filter(([key]) => key !== 'requestId'),
      );
      const inputHash = canonicalHash({ input: sessionBody, meta });
      const existing = await client.query<SessionDbRow>(
        `select id, started_at, expires_at, is_test, input_hash
         from analytics_sessions where request_id = $1 for update`,
        [input.requestId],
      );
      const prior = existing.rows[0];
      if (prior) {
        if (prior.input_hash !== inputHash) {
          throw new AnalyticsError('requestId was already used with another payload', 409, 'request_conflict');
        }
        return storedSession(prior);
      }

      const linkId = input.ref
        ? (await client.query<{ id: string }>(
          'select id from analytics_links where token_hash = $1 and disabled_at is null',
          [hash(input.ref)],
        )).rows[0]?.id ?? null
        : null;
      const id = randomUUID();
      const expiresAt = new Date(now.getTime() + LIMITS.sessionTtlMs);
      const inserted = await client.query<SessionDbRow>(
        `insert into analytics_sessions
          (id, request_id, input_hash, browser_id, link_id, started_at, expires_at,
           last_received_at, first_path, source_origin, utm, device, browser_family,
           suspected_bot, is_test)
         values ($1,$2,$3,$4,$5,$6,$7,$6,$8,$9,$10::jsonb,$11,$12,$13,$14)
         returning id, started_at, expires_at, is_test`,
        [
          id, input.requestId, inputHash, input.browserId, linkId, now, expiresAt,
          input.path, input.sourceOrigin ?? null, JSON.stringify(input.utm ?? {}),
          meta.device, meta.browserFamily, meta.suspectedBot, meta.isTest,
        ],
      );
      return storedSession(inserted.rows[0]!);
    });
  },

  async insertBatch(batch, now) {
    if (batch.events.length < 1 || batch.events.length > LIMITS.batchEvents) {
      throw new AnalyticsError('Invalid batch event count', 400, 'invalid_batch');
    }
    return transaction(pool, async (client) => {
      const sessions = await client.query<SessionDbRow>(
        `select id, started_at, expires_at, last_received_at, is_test
         from analytics_sessions where id = $1 for update`,
        [batch.sessionId],
      );
      const session = sessions.rows[0];
      if (!session) {
        const tombstone = await client.query(
          'select 1 from analytics_deleted_requests where request_hash = $1 and expires_at > $2',
          [sessionTombstoneHash(batch.sessionId), now],
        );
        throw new AnalyticsError(
          tombstone.rows.length ? 'Session was deleted' : 'Session not found',
          tombstone.rows.length ? 410 : 404,
          tombstone.rows.length ? 'session_deleted' : 'session_not_found',
        );
      }
      if (
        session.expires_at.getTime() <= now.getTime()
        || !session.last_received_at
        || session.last_received_at.getTime() <= now.getTime() - LIMITS.sessionIdleMs
      ) {
        throw new AnalyticsError('Session expired', 410, 'session_expired');
      }

      await client.query(
        `insert into analytics_page_views
          (id, session_id, path, client_started_at, first_received_at, last_received_at)
         values ($1,$2,$3,$4,$5,$5)
         on conflict (id) do nothing`,
        [batch.pageViewId, batch.sessionId, batch.path, batch.pageStartedAt, now],
      );
      const pages = await client.query<{
        session_id: string;
        path: string;
        client_started_at: Date;
      }>(
        'select session_id, path, client_started_at from analytics_page_views where id = $1 for update',
        [batch.pageViewId],
      );
      const page = pages.rows[0]!;
      if (
        page.session_id !== batch.sessionId
        || page.path !== batch.path
        || page.client_started_at.getTime() !== new Date(batch.pageStartedAt).getTime()
      ) {
        throw new AnalyticsError('pageViewId belongs to another page', 409, 'page_conflict');
      }

      const payloadHash = canonicalHash({ ...batch, ingestToken: undefined });
      const batchId = randomUUID();
      const inserted = await client.query<{ id: string }>(
        `insert into analytics_batches
          (id, page_view_id, sequence, payload_hash, received_at, dropped_events)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (page_view_id, sequence) do nothing
         returning id`,
        [batchId, batch.pageViewId, batch.sequence, payloadHash, now, batch.droppedEvents],
      );
      if (!inserted.rows.length) {
        const existing = await client.query<{ payload_hash: string }>(
          'select payload_hash from analytics_batches where page_view_id = $1 and sequence = $2',
          [batch.pageViewId, batch.sequence],
        );
        if (existing.rows[0]?.payload_hash !== payloadHash) {
          throw new AnalyticsError('Batch sequence has another payload', 409, 'batch_conflict');
        }
        return 'duplicate';
      }

      for (const [ordinal, event] of batch.events.entries()) {
        await client.query(
          `insert into analytics_events (batch_id, ordinal, type, at_ms, payload)
           values ($1,$2,$3,$4,$5::jsonb)`,
          [batchId, ordinal, event.type, event.atMs, JSON.stringify(event)],
        );
      }
      await client.query(
        'update analytics_page_views set last_received_at = greatest(last_received_at, $2) where id = $1',
        [batch.pageViewId, now],
      );
      await client.query(
        'update analytics_sessions set last_received_at = greatest(last_received_at, $2) where id = $1',
        [batch.sessionId, now],
      );
      return 'inserted';
    });
  },

  async sessionIsActive(id, now) {
    const result = await pool.query(
      `select 1 from analytics_sessions
       where id = $1 and expires_at > $2 and last_received_at > $2 - interval '30 minutes'`,
      [id, now],
    );
    return result.rows.length > 0;
  },

  async deleteSession(id, now) {
    return transaction(pool, async (client) => {
      const found = await client.query<{ request_id: string }>(
        'select request_id from analytics_sessions where id = $1',
        [id],
      );
      const requestId = found.rows[0]?.request_id;
      if (!requestId) return false;
      const requestHash = hash(requestId);
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [requestHash]);
      const locked = await client.query<{ request_id: string }>(
        'select request_id from analytics_sessions where id = $1 for update',
        [id],
      );
      const row = locked.rows[0];
      if (!row) return false;
      const expiresAt = new Date(now.getTime() + LIMITS.retentionDays * 24 * 60 * 60 * 1_000);
      await client.query(
        `insert into analytics_deleted_requests (request_hash, expires_at)
         values ($1,$3),($2,$3)
         on conflict (request_hash) do update set expires_at = greatest(analytics_deleted_requests.expires_at, excluded.expires_at)`,
        [requestHash, sessionTombstoneHash(id), expiresAt],
      );
      await client.query('delete from analytics_sessions where id = $1', [id]);
      return true;
    });
  },

  async takeRateLimit(key, limit, now) {
    if (!Number.isInteger(limit) || limit < 1) throw new AnalyticsError('Invalid rate limit', 400);
    const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    const expiresAt = new Date(windowStart.getTime() + 24 * 60 * 60 * 1_000);
    const result = await pool.query<{ count: number }>(
      `insert into analytics_rate_limits (key, window_start, count, expires_at)
       values ($1,$2,1,$3)
       on conflict (key) do update set
         window_start = excluded.window_start,
         count = case
           when analytics_rate_limits.window_start = excluded.window_start
             then analytics_rate_limits.count + 1
           else 1
         end,
         expires_at = excluded.expires_at
       returning count`,
      [key, windowStart, expiresAt],
    );
    return result.rows[0]!.count <= limit;
  },

  async resolveActiveLink(tokenHash) {
    const result = await pool.query<{ id: string }>(
      'select id from analytics_links where token_hash = $1 and disabled_at is null',
      [tokenHash],
    );
    return result.rows[0] ?? null;
  },

  async createLink(input, tokenHash, now) {
    try {
      const result = await pool.query<LinkDbRow>(
        `insert into analytics_links
          (id, token_hash, company_label, position, submitted_at, note, created_at)
         values ($1,$2,$3,$4,$5,$6,$7)
         returning id, company_label, position, submitted_at, note, created_at, disabled_at`,
        [randomUUID(), tokenHash, input.companyLabel, input.position, input.submittedAt, input.note, now],
      );
      return trackingLink(result.rows[0]!);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AnalyticsError('Tracking token already exists', 409, 'link_conflict');
      }
      throw error;
    }
  },

  async listLinks(options = {}) {
    const limit = options.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new AnalyticsError('Invalid link list limit', 400, 'invalid_limit');
    }
    const cursor = options.cursor ? decodeLinkCursor(options.cursor) : null;
    const result = await pool.query<LinkDbRow>(
      `select id, company_label, position, submitted_at, note, created_at, disabled_at
       from analytics_links
       where ($1::timestamptz is null or (created_at, id) < ($1::timestamptz, $2::uuid))
       order by created_at desc, id desc
       limit $3`,
      [cursor?.createdAt ?? null, cursor?.id ?? null, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);
    return {
      links: rows.map(trackingLink),
      nextCursor: hasMore && last
        ? Buffer.from(JSON.stringify({ createdAt: last.created_at.toISOString(), id: last.id })).toString('base64url')
        : null,
    };
  },

  async updateLink(id, input, now) {
    const result = await pool.query<LinkDbRow>(
      `update analytics_links set
         company_label = coalesce($2, company_label),
         position = coalesce($3, position),
         submitted_at = case when $4::boolean then $5::date else submitted_at end,
         note = coalesce($6, note),
         disabled_at = case
           when $7::boolean is null then disabled_at
           when $7 then $8
           else null
         end
       where id = $1
       returning id, company_label, position, submitted_at, note, created_at, disabled_at`,
      [
        id, input.companyLabel ?? null, input.position ?? null,
        Object.hasOwn(input, 'submittedAt'), input.submittedAt ?? null,
        input.note ?? null, input.disabled ?? null, now,
      ],
    );
    return result.rows[0] ? trackingLink(result.rows[0]) : null;
  },

  async deleteLink(id) {
    const result = await pool.query('delete from analytics_links where id = $1 returning id', [id]);
    return result.rows.length > 0;
  },
});
