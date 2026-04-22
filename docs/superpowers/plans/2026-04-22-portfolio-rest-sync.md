# Portfolio REST Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the daily portfolio JSON publication path with a token-protected REST DB sync while keeping generated screenshot assets file-based and committing only changed generated images.

**Architecture:** The portfolio app gets a token-authenticated internal sync API backed by `pg` and `admin_replace_section()`, plus a bootstrap read path so the automation script can preserve project ids and fallback metadata without reading stale repo JSON. The Obsidian automation keeps generating notes and screenshots, fetches current portfolio seed data over REST, publishes the three portfolio sections over REST in one transaction, and only commits/pushes generated image assets when the publication succeeded.

**Tech Stack:** Next.js App Router, TypeScript, Zod, `pg`, Node built-in test runner with `tsx`, Python 3 stdlib (`urllib`, `unittest`, `unittest.mock`), Git.

---

## File Map

### Portfolio repo

- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/auth.ts`
  - Bearer token parsing and auth result helpers for internal sync routes.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/schema.ts`
  - Batch payload schema, section key constants, and parsed request types.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/db.ts`
  - `pg` pool singleton, transactional section replacement, and bootstrap export helpers.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/handler.ts`
  - HTTP-independent GET/POST request handling with injected dependencies for tests.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/app/api/internal/sync/portfolio/route.ts`
  - Next.js App Router bridge that exposes the internal sync endpoint.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/fixtures.ts`
  - Shared request/response fixtures for route and service tests.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/auth-and-schema.test.ts`
  - Coverage for bearer token auth and request schema validation.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/db.test.ts`
  - Coverage for transaction order, rollback, and bootstrap export queries.
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/handler.test.ts`
  - Coverage for GET/POST auth, validation, success, and error responses.
- Modify: `/Users/seungkyu/Documents/ysk9926/portfolio/package.json`
  - Add a repeatable internal sync test command.
- Modify: `/Users/seungkyu/Documents/ysk9926/portfolio/README.md`
  - Document `PORTFOLIO_SYNC_API_TOKEN`, `SUPABASE_DB_URL`, and the new internal sync path.

### Obsidian vault automation workspace

- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/portfolio_rest_sync.py`
  - REST GET/POST client helpers and structured sync error handling.
- Modify: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py`
  - Switch bootstrap/publish flow from repo JSON files to REST, update commit rules, and update reporting.
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/__init__.py`
  - Makes the vault test directory importable by `unittest`.
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_portfolio_rest_sync.py`
  - Unit tests for the REST helper module.
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`
  - Unit tests for bootstrap loading, publish orchestration, and image-only commit selection.

### Working assumptions

- `/Users/seungkyu/Documents/ysk9926/portfolio` is a git repo and should receive incremental commits.
- `/Users/seungkyu/Documents/Obsidian Vault/02-Projects` is **not** a git repo, so vault-side steps cannot end with a git commit. Record changed vault files in the execution log instead.
- The plan adds `GET /api/internal/sync/portfolio` as a bootstrap read for the automation script. This is a small refinement over the approved spec and avoids keeping dirty uncommitted JSON cache files inside the portfolio repo.

## Task 1: Add internal sync auth, schema, fixtures, and test runner

**Files:**
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/fixtures.ts`
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/auth-and-schema.test.ts`
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/schema.ts`
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/auth.ts`
- Modify: `/Users/seungkyu/Documents/ysk9926/portfolio/package.json`

- [ ] **Step 1: Write the failing fixtures and auth/schema tests**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/fixtures.ts
export const makePortfolioSyncRequest = () => ({
  payloads: {
    projects: [],
    'project-portfolio-sync': {
      generatedAt: '2026-04-22T17:40:00+09:00',
      projects: [],
    },
    'activity-heatmap': {
      generatedAt: '2026-04-22T17:40:00+09:00',
      rangeStart: '2025-04-23',
      rangeEnd: '2026-04-22',
      summary: {
        activeDays: 0,
        companyActiveDays: 0,
        personalActiveDays: 0,
        totalCompanyCommits: 0,
        totalPersonalCommits: 0,
        totalCommits: 0,
        latestActiveDate: null,
      },
      weeks: [],
    },
  },
  meta: {
    source: 'daily-project-sync',
    runAt: '2026-04-22T17:40:00+09:00',
  },
});

export const makePortfolioSyncPayloads = () => makePortfolioSyncRequest().payloads;

// /Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/auth-and-schema.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPortfolioSyncToken } from '../../lib/internal-sync/auth';
import {
  parsePortfolioSyncRequest,
  portfolioBootstrapSectionKeys,
  portfolioSyncSectionKeys,
} from '../../lib/internal-sync/schema';
import { makePortfolioSyncRequest } from './fixtures';

test('portfolio sync section keys stay in write order', () => {
  assert.deepEqual(portfolioSyncSectionKeys, [
    'projects',
    'project-portfolio-sync',
    'activity-heatmap',
  ]);
  assert.deepEqual(portfolioBootstrapSectionKeys, [
    'projects',
    'project-portfolio-sync',
  ]);
});

test('assertPortfolioSyncToken returns 401 when auth header is missing', () => {
  const result = assertPortfolioSyncToken(new Headers(), 'sync-secret');
  assert.deepEqual(result, {
    ok: false,
    status: 401,
    error: 'Missing bearer token',
  });
});

test('assertPortfolioSyncToken returns 403 when token is wrong', () => {
  const headers = new Headers({
    authorization: 'Bearer wrong-secret',
  });
  const result = assertPortfolioSyncToken(headers, 'sync-secret');
  assert.deepEqual(result, {
    ok: false,
    status: 403,
    error: 'Invalid bearer token',
  });
});

test('parsePortfolioSyncRequest accepts the full three-section payload', () => {
  const parsed = parsePortfolioSyncRequest(makePortfolioSyncRequest());
  assert.equal(parsed.success, true);
});

test('parsePortfolioSyncRequest rejects a request missing activity-heatmap', () => {
  const invalid = makePortfolioSyncRequest();
  // @ts-expect-error intentional invalid fixture
  delete invalid.payloads['activity-heatmap'];
  const parsed = parsePortfolioSyncRequest(invalid);
  assert.equal(parsed.success, false);
  if (parsed.success) return;
  assert.match(JSON.stringify(parsed.error.flatten()), /activity-heatmap/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
node --import tsx --test tests/internal-sync/auth-and-schema.test.ts
```

Expected: FAIL with `Cannot find module '../../lib/internal-sync/auth'` and `../../lib/internal-sync/schema`.

- [ ] **Step 3: Create the shared request schema**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/schema.ts
import { z } from 'zod';
import { sectionPayloadSchemaMap } from '@/lib/types/payload';

export const portfolioSyncSectionKeys = [
  'projects',
  'project-portfolio-sync',
  'activity-heatmap',
] as const;

export const portfolioBootstrapSectionKeys = [
  'projects',
  'project-portfolio-sync',
] as const;

export type PortfolioSyncSectionKey = (typeof portfolioSyncSectionKeys)[number];
export type PortfolioBootstrapSectionKey = (typeof portfolioBootstrapSectionKeys)[number];

export const portfolioSyncRequestSchema = z.object({
  payloads: z.object({
    projects: sectionPayloadSchemaMap.projects,
    'project-portfolio-sync': sectionPayloadSchemaMap['project-portfolio-sync'],
    'activity-heatmap': sectionPayloadSchemaMap['activity-heatmap'],
  }),
  meta: z.object({
    source: z.string().min(1),
    runAt: z.string().min(1),
  }),
});

export type PortfolioSyncRequestBody = z.infer<typeof portfolioSyncRequestSchema>;
export type PortfolioSyncPayloads = PortfolioSyncRequestBody['payloads'];

export const parsePortfolioSyncRequest = (input: unknown) =>
  portfolioSyncRequestSchema.safeParse(input);
```

- [ ] **Step 4: Create the bearer token helper**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/auth.ts
export type TokenAuthResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403;
      error: 'Missing bearer token' | 'Invalid bearer token';
    };

export const assertPortfolioSyncToken = (
  headers: Headers,
  expectedToken: string,
): TokenAuthResult => {
  const authorization = headers.get('authorization')?.trim();
  if (!authorization?.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Missing bearer token',
    };
  }

  const providedToken = authorization.slice('Bearer '.length).trim();
  if (!providedToken || providedToken !== expectedToken) {
    return {
      ok: false,
      status: 403,
      error: 'Invalid bearer token',
    };
  }

  return { ok: true };
};
```

- [ ] **Step 5: Add the internal sync test command and rerun**

```json
// /Users/seungkyu/Documents/ysk9926/portfolio/package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test:internal-sync": "node --import tsx --test tests/internal-sync/*.test.ts",
    "supabase:seed": "tsx scripts/supabase/seed-from-json.ts",
    "supabase:verify": "tsx scripts/supabase/verify-roundtrip.ts"
  }
}
```

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
npm run test:internal-sync
```

Expected: PASS with `5 tests` and `0 failures`.

- [ ] **Step 6: Commit the auth/schema scaffolding**

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
git add package.json lib/internal-sync/auth.ts lib/internal-sync/schema.ts tests/internal-sync/fixtures.ts tests/internal-sync/auth-and-schema.test.ts
git commit -m "test: add portfolio sync auth and schema coverage"
```

## Task 2: Add transactional DB sync and bootstrap export helpers

**Files:**
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/db.test.ts`
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/db.ts`
- Modify: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/schema.ts`

- [ ] **Step 1: Write the failing DB service tests**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/db.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { makePortfolioSyncPayloads } from './fixtures';
import {
  PortfolioSectionSyncError,
  exportPortfolioBootstrapWithClient,
  syncPortfolioSectionsWithClient,
} from '../../lib/internal-sync/db';

test('syncPortfolioSectionsWithClient wraps the three section writes in one transaction', async () => {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const client = {
    async query(sql: string, values?: unknown[]) {
      calls.push({ sql, values });
      return { rows: [{ updated_at: '2026-04-22T08:40:11.123Z' }] };
    },
  };

  const result = await syncPortfolioSectionsWithClient(
    client,
    makePortfolioSyncPayloads(),
  );

  assert.deepEqual(
    calls.map((entry) => entry.sql),
    [
      'begin',
      'select public.admin_replace_section($1, $2::jsonb) as updated_at',
      'select public.admin_replace_section($1, $2::jsonb) as updated_at',
      'select public.admin_replace_section($1, $2::jsonb) as updated_at',
      'commit',
    ],
  );
  assert.deepEqual(result.updatedSections, [
    'projects',
    'project-portfolio-sync',
    'activity-heatmap',
  ]);
  assert.equal(result.updatedAtBySection.projects, '2026-04-22T08:40:11.123Z');
});

test('syncPortfolioSectionsWithClient rolls back and reports the failing section', async () => {
  const calls: string[] = [];
  const client = {
    async query(sql: string, values?: unknown[]) {
      calls.push(sql);
      if (
        sql === 'select public.admin_replace_section($1, $2::jsonb) as updated_at' &&
        values?.[0] === 'project-portfolio-sync'
      ) {
        throw new Error('db exploded');
      }
      return { rows: [{ updated_at: '2026-04-22T08:40:11.123Z' }] };
    },
  };

  await assert.rejects(
    () => syncPortfolioSectionsWithClient(client, makePortfolioSyncPayloads()),
    (error: unknown) => {
      assert.ok(error instanceof PortfolioSectionSyncError);
      assert.equal(error.section, 'project-portfolio-sync');
      assert.match(error.message, /project-portfolio-sync/);
      return true;
    },
  );

  assert.equal(calls.at(-1), 'rollback');
});

test('exportPortfolioBootstrapWithClient reads the two bootstrap sections in order', async () => {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const client = {
    async query(sql: string, values?: unknown[]) {
      calls.push({ sql, values });
      return {
        rows: [
          {
            payload:
              values?.[0] === 'projects'
                ? []
                : {
                    generatedAt: '2026-04-22T17:40:00+09:00',
                    projects: [],
                  },
          },
        ],
      };
    },
  };

  const result = await exportPortfolioBootstrapWithClient(client);

  assert.deepEqual(calls.map((entry) => entry.values?.[0]), [
    'projects',
    'project-portfolio-sync',
  ]);
  assert.deepEqual(result.projects, []);
  assert.deepEqual(result['project-portfolio-sync'], {
    generatedAt: '2026-04-22T17:40:00+09:00',
    projects: [],
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
node --import tsx --test tests/internal-sync/db.test.ts
```

Expected: FAIL with `Cannot find module '../../lib/internal-sync/db'`.

- [ ] **Step 3: Implement the transactional DB helpers**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/db.ts
import { Pool, type PoolClient } from 'pg';
import { sectionPayloadSchemaMap } from '@/lib/types/payload';
import {
  type PortfolioBootstrapPayloads,
  portfolioBootstrapSectionKeys,
  portfolioSyncSectionKeys,
  type PortfolioSyncPayloads,
  type PortfolioSyncSectionKey,
} from './schema';

const dbUrl = process.env.SUPABASE_DB_URL;
let pool: Pool | null = null;

export interface SqlClientLike {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}

export class PortfolioSectionSyncError extends Error {
  constructor(
    public readonly section: PortfolioSyncSectionKey,
    cause: unknown,
  ) {
    super(
      cause instanceof Error
        ? `Failed to sync section "${section}": ${cause.message}`
        : `Failed to sync section "${section}"`,
    );
  }
}

const getPool = () => {
  if (!dbUrl) {
    throw new Error('Missing env: SUPABASE_DB_URL');
  }
  if (!pool) {
    pool = new Pool({ connectionString: dbUrl });
  }
  return pool;
};

export const syncPortfolioSectionsWithClient = async (
  client: SqlClientLike,
  payloads: PortfolioSyncPayloads,
) => {
  const updatedAtBySection = {} as Record<PortfolioSyncSectionKey, string>;
  await client.query('begin');
  try {
    for (const sectionKey of portfolioSyncSectionKeys) {
      try {
        const result = await client.query<{ updated_at: string }>(
          'select public.admin_replace_section($1, $2::jsonb) as updated_at',
          [sectionKey, JSON.stringify(payloads[sectionKey])],
        );
        updatedAtBySection[sectionKey] = result.rows[0]?.updated_at ?? '';
      } catch (error) {
        throw new PortfolioSectionSyncError(sectionKey, error);
      }
    }
    await client.query('commit');
    return {
      updatedSections: [...portfolioSyncSectionKeys],
      updatedAtBySection,
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
};

export const exportPortfolioBootstrapWithClient = async (
  client: SqlClientLike,
) => {
  const payloads = {} as PortfolioBootstrapPayloads;
  for (const sectionKey of portfolioBootstrapSectionKeys) {
    const result = await client.query<{ payload: unknown }>(
      'select public.export_section_payload($1) as payload',
      [sectionKey],
    );
    payloads[sectionKey] = sectionPayloadSchemaMap[sectionKey].parse(
      result.rows[0]?.payload,
    );
  }
  return payloads;
};

export const syncPortfolioSections = async (payloads: PortfolioSyncPayloads) => {
  const client = await getPool().connect();
  try {
    return await syncPortfolioSectionsWithClient(client, payloads);
  } finally {
    client.release();
  }
};

export const exportPortfolioBootstrap = async () => {
  const client: PoolClient = await getPool().connect();
  try {
    return await exportPortfolioBootstrapWithClient(client);
  } finally {
    client.release();
  }
};
```

- [ ] **Step 4: Export the parsed request types needed by the service**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/schema.ts
export type PortfolioSyncRequestBody = z.infer<typeof portfolioSyncRequestSchema>;
export type PortfolioSyncPayloads = PortfolioSyncRequestBody['payloads'];
export type PortfolioBootstrapPayloads = Pick<
  PortfolioSyncPayloads,
  'projects' | 'project-portfolio-sync'
>;
```

- [ ] **Step 5: Run the DB tests**

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
npm run test:internal-sync
```

Expected: PASS with the new DB tests included.

- [ ] **Step 6: Commit the DB sync service**

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
git add lib/internal-sync/db.ts lib/internal-sync/schema.ts tests/internal-sync/db.test.ts
git commit -m "feat: add portfolio sync db service"
```

## Task 3: Add the internal sync GET/POST handler, route, and env docs

**Files:**
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/handler.test.ts`
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/handler.ts`
- Create: `/Users/seungkyu/Documents/ysk9926/portfolio/app/api/internal/sync/portfolio/route.ts`
- Modify: `/Users/seungkyu/Documents/ysk9926/portfolio/README.md`

- [ ] **Step 1: Write the failing handler tests**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/tests/internal-sync/handler.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handlePortfolioSyncGet,
  handlePortfolioSyncPost,
} from '../../lib/internal-sync/handler';
import { makePortfolioSyncRequest, makePortfolioSyncPayloads } from './fixtures';
import { PortfolioSectionSyncError } from '../../lib/internal-sync/db';

test('GET returns 401 when bearer token is missing', async () => {
  const response = await handlePortfolioSyncGet(
    new Request('http://localhost/api/internal/sync/portfolio'),
    {
      expectedToken: 'sync-secret',
      exportBootstrap: async () => makePortfolioSyncPayloads(),
    },
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'Missing bearer token',
  });
});

test('GET returns the bootstrap payloads when auth succeeds', async () => {
  const response = await handlePortfolioSyncGet(
    new Request('http://localhost/api/internal/sync/portfolio', {
      headers: {
        authorization: 'Bearer sync-secret',
      },
    }),
    {
      expectedToken: 'sync-secret',
      exportBootstrap: async () => ({
        projects: [],
        'project-portfolio-sync': {
          generatedAt: '2026-04-22T17:40:00+09:00',
          projects: [],
        },
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    payloads: {
      projects: [],
      'project-portfolio-sync': {
        generatedAt: '2026-04-22T17:40:00+09:00',
        projects: [],
      },
    },
  });
});

test('POST returns 400 when the batch payload is invalid', async () => {
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost/api/internal/sync/portfolio', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ payloads: { projects: [] } }),
    }),
    {
      expectedToken: 'sync-secret',
      syncSections: async () => {
        throw new Error('should not be called');
      },
    },
  );

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, 'Validation failed');
});

test('POST returns 200 with updatedAtBySection on success', async () => {
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost/api/internal/sync/portfolio', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify(makePortfolioSyncRequest()),
    }),
    {
      expectedToken: 'sync-secret',
      syncSections: async () => ({
        updatedSections: [
          'projects',
          'project-portfolio-sync',
          'activity-heatmap',
        ],
        updatedAtBySection: {
          projects: '2026-04-22T08:40:11.123Z',
          'project-portfolio-sync': '2026-04-22T08:40:11.123Z',
          'activity-heatmap': '2026-04-22T08:40:11.123Z',
        },
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    updatedSections: [
      'projects',
      'project-portfolio-sync',
      'activity-heatmap',
    ],
    updatedAtBySection: {
      projects: '2026-04-22T08:40:11.123Z',
      'project-portfolio-sync': '2026-04-22T08:40:11.123Z',
      'activity-heatmap': '2026-04-22T08:40:11.123Z',
    },
  });
});

test('POST surfaces the failing section from the DB layer', async () => {
  const response = await handlePortfolioSyncPost(
    new Request('http://localhost/api/internal/sync/portfolio', {
      method: 'POST',
      headers: {
        authorization: 'Bearer sync-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify(makePortfolioSyncRequest()),
    }),
    {
      expectedToken: 'sync-secret',
      syncSections: async () => {
        throw new PortfolioSectionSyncError(
          'project-portfolio-sync',
          new Error('db exploded'),
        );
      },
    },
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'Failed to sync portfolio sections',
    section: 'project-portfolio-sync',
    details: 'Failed to sync section "project-portfolio-sync": db exploded',
  });
});
```

- [ ] **Step 2: Run the handler tests to verify they fail**

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
node --import tsx --test tests/internal-sync/handler.test.ts
```

Expected: FAIL with `Cannot find module '../../lib/internal-sync/handler'`.

- [ ] **Step 3: Implement the HTTP-independent handler**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/lib/internal-sync/handler.ts
import { assertPortfolioSyncToken } from './auth';
import {
  exportPortfolioBootstrap,
  PortfolioSectionSyncError,
  syncPortfolioSections,
} from './db';
import { parsePortfolioSyncRequest } from './schema';

interface HandlerDeps {
  expectedToken?: string;
  exportBootstrap?: typeof exportPortfolioBootstrap;
  syncSections?: typeof syncPortfolioSections;
}

const resolveExpectedToken = (deps: HandlerDeps) => {
  const token = deps.expectedToken ?? process.env.PORTFOLIO_SYNC_API_TOKEN;
  if (!token) {
    throw new Error('Missing env: PORTFOLIO_SYNC_API_TOKEN');
  }
  return token;
};

export const handlePortfolioSyncGet = async (
  request: Request,
  deps: HandlerDeps = {},
) => {
  try {
    const expectedToken = resolveExpectedToken(deps);
    const auth = assertPortfolioSyncToken(request.headers, expectedToken);
    if (!auth.ok) {
      return Response.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const payloads = await (deps.exportBootstrap ?? exportPortfolioBootstrap)();
    return Response.json({ ok: true, payloads });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Unknown bootstrap sync error',
      },
      { status: 500 },
    );
  }
};

export const handlePortfolioSyncPost = async (
  request: Request,
  deps: HandlerDeps = {},
) => {
  try {
    const expectedToken = resolveExpectedToken(deps);
    const auth = assertPortfolioSyncToken(request.headers, expectedToken);
    if (!auth.ok) {
      return Response.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const parsed = parsePortfolioSyncRequest(body);
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await (deps.syncSections ?? syncPortfolioSections)(
      parsed.data.payloads,
    );

    return Response.json({
      ok: true,
      updatedSections: result.updatedSections,
      updatedAtBySection: result.updatedAtBySection,
    });
  } catch (error) {
    if (error instanceof PortfolioSectionSyncError) {
      return Response.json(
        {
          ok: false,
          error: 'Failed to sync portfolio sections',
          section: error.section,
          details: error.message,
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Unknown sync error',
      },
      { status: 500 },
    );
  }
};
```

- [ ] **Step 4: Add the route bridge and document the new env variables**

```ts
// /Users/seungkyu/Documents/ysk9926/portfolio/app/api/internal/sync/portfolio/route.ts
import {
  handlePortfolioSyncGet,
  handlePortfolioSyncPost,
} from '@/lib/internal-sync/handler';

export async function GET(request: Request) {
  return handlePortfolioSyncGet(request);
}

export async function POST(request: Request) {
  return handlePortfolioSyncPost(request);
}
```

```md
<!-- /Users/seungkyu/Documents/ysk9926/portfolio/README.md -->
## Internal portfolio sync

The daily project sync automation writes portfolio data through
`/api/internal/sync/portfolio`.

Required server environment variables:

- `SUPABASE_DB_URL`
- `PORTFOLIO_SYNC_API_TOKEN`

Required automation environment variables:

- `PORTFOLIO_SYNC_API_URL`
- `PORTFOLIO_SYNC_API_TOKEN`

The automation publishes these DB-backed sections:

- `projects`
- `project-portfolio-sync`
- `activity-heatmap`

Generated screenshots remain file-based under
`public/images/projects/generated/**`.
```

- [ ] **Step 5: Run handler tests and lint**

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
npm run test:internal-sync
npm run lint
```

Expected:

- `test:internal-sync` PASS
- `lint` PASS with no new errors

- [ ] **Step 6: Commit the route and docs**

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
git add README.md app/api/internal/sync/portfolio/route.ts lib/internal-sync/handler.ts tests/internal-sync/handler.test.ts
git commit -m "feat: add internal portfolio sync route"
```

## Task 4: Add Python REST helpers for bootstrap and publication

**Files:**
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/__init__.py`
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_portfolio_rest_sync.py`
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/portfolio_rest_sync.py`

- [ ] **Step 1: Write the failing Python helper tests**

```py
# /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/__init__.py

# /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_portfolio_rest_sync.py
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from scripts.portfolio_rest_sync import (
    PortfolioRestSyncError,
    fetch_portfolio_seed_payloads,
    post_portfolio_sync,
)


class PortfolioRestSyncTests(unittest.TestCase):
    @patch("scripts.portfolio_rest_sync.urllib_request.urlopen")
    def test_fetch_portfolio_seed_payloads_uses_bearer_get(self, mock_urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps(
            {
                "ok": True,
                "payloads": {
                    "projects": [],
                    "project-portfolio-sync": {
                        "generatedAt": "2026-04-22T17:40:00+09:00",
                        "projects": [],
                    },
                },
            }
        ).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = response

        payloads = fetch_portfolio_seed_payloads(
            "https://portfolio.example.com/api/internal/sync/portfolio",
            "sync-secret",
        )

        request_obj = mock_urlopen.call_args.args[0]
        self.assertEqual(request_obj.get_method(), "GET")
        self.assertEqual(request_obj.headers["Authorization"], "Bearer sync-secret")
        self.assertEqual(payloads["projects"], [])

    @patch("scripts.portfolio_rest_sync.urllib_request.urlopen")
    def test_post_portfolio_sync_posts_json_batch(self, mock_urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps(
            {
                "ok": True,
                "updatedSections": [
                    "projects",
                    "project-portfolio-sync",
                    "activity-heatmap",
                ],
                "updatedAtBySection": {
                    "projects": "2026-04-22T08:40:11.123Z",
                    "project-portfolio-sync": "2026-04-22T08:40:11.123Z",
                    "activity-heatmap": "2026-04-22T08:40:11.123Z",
                },
            }
        ).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = response

        result = post_portfolio_sync(
            "https://portfolio.example.com/api/internal/sync/portfolio",
            "sync-secret",
            {
                "projects": [],
                "project-portfolio-sync": {
                    "generatedAt": "2026-04-22T17:40:00+09:00",
                    "projects": [],
                },
                "activity-heatmap": {
                    "generatedAt": "2026-04-22T17:40:00+09:00",
                    "rangeStart": "2025-04-23",
                    "rangeEnd": "2026-04-22",
                    "summary": {
                        "activeDays": 0,
                        "companyActiveDays": 0,
                        "personalActiveDays": 0,
                        "totalCompanyCommits": 0,
                        "totalPersonalCommits": 0,
                        "totalCommits": 0,
                        "latestActiveDate": None,
                    },
                    "weeks": [],
                },
            },
            source="daily-project-sync",
            run_at="2026-04-22T17:40:00+09:00",
        )

        request_obj = mock_urlopen.call_args.args[0]
        posted_body = json.loads(request_obj.data.decode("utf-8"))
        self.assertEqual(request_obj.get_method(), "POST")
        self.assertEqual(request_obj.headers["Authorization"], "Bearer sync-secret")
        self.assertEqual(posted_body["meta"]["source"], "daily-project-sync")
        self.assertEqual(
            result["updatedAtBySection"]["projects"],
            "2026-04-22T08:40:11.123Z",
        )

    @patch("scripts.portfolio_rest_sync.urllib_request.urlopen")
    def test_post_portfolio_sync_raises_structured_error_on_http_failure(self, mock_urlopen):
        mock_error = MagicMock()
        mock_error.read.return_value = b'{"ok": false, "error": "boom"}'
        mock_error.code = 500
        mock_urlopen.side_effect = PortfolioRestSyncError(
            "POST", 500, '{"ok": false, "error": "boom"}'
        )

        with self.assertRaises(PortfolioRestSyncError):
            post_portfolio_sync(
                "https://portfolio.example.com/api/internal/sync/portfolio",
                "sync-secret",
                {
                    "projects": [],
                    "project-portfolio-sync": {
                        "generatedAt": "2026-04-22T17:40:00+09:00",
                        "projects": [],
                    },
                    "activity-heatmap": {
                        "generatedAt": "2026-04-22T17:40:00+09:00",
                        "rangeStart": "2025-04-23",
                        "rangeEnd": "2026-04-22",
                        "summary": {
                            "activeDays": 0,
                            "companyActiveDays": 0,
                            "personalActiveDays": 0,
                            "totalCompanyCommits": 0,
                            "totalPersonalCommits": 0,
                            "totalCommits": 0,
                            "latestActiveDate": None,
                        },
                        "weeks": [],
                    },
                },
                source="daily-project-sync",
                run_at="2026-04-22T17:40:00+09:00",
            )
```

- [ ] **Step 2: Run the Python tests to verify they fail**

Run:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
python3 -m unittest tests.test_portfolio_rest_sync -v
```

Expected: FAIL with `No module named 'scripts.portfolio_rest_sync'`.

- [ ] **Step 3: Implement the REST helper module**

```py
# /Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/portfolio_rest_sync.py
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request


@dataclass(slots=True)
class PortfolioRestSyncError(RuntimeError):
    method: str
    status: int
    body: str

    def __str__(self) -> str:
        return f"{self.method} portfolio sync failed ({self.status}): {self.body}"


def _json_request(url: str, method: str, token: str, payload: dict[str, Any] | None = None):
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
    }
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"

    return urllib_request.Request(url, data=data, headers=headers, method=method)


def _read_json_response(method: str, request_obj: urllib_request.Request, timeout: float) -> dict[str, Any]:
    try:
        with urllib_request.urlopen(request_obj, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib_error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise PortfolioRestSyncError(method, exc.code, error_body) from exc
    except urllib_error.URLError as exc:
        raise PortfolioRestSyncError(method, 0, str(exc.reason)) from exc

    parsed = json.loads(body)
    if not isinstance(parsed, dict):
        raise PortfolioRestSyncError(method, 0, "Expected JSON object response")
    return parsed


def fetch_portfolio_seed_payloads(
    sync_url: str,
    token: str,
    *,
    timeout: float = 30.0,
) -> dict[str, Any]:
    request_obj = _json_request(sync_url, "GET", token)
    response = _read_json_response("GET", request_obj, timeout)
    if not response.get("ok"):
        raise PortfolioRestSyncError("GET", 0, json.dumps(response, ensure_ascii=False))
    payloads = response.get("payloads")
    if not isinstance(payloads, dict):
        raise PortfolioRestSyncError("GET", 0, "Missing payloads object")
    return payloads


def post_portfolio_sync(
    sync_url: str,
    token: str,
    payloads: dict[str, Any],
    *,
    source: str,
    run_at: str,
    timeout: float = 30.0,
) -> dict[str, Any]:
    request_obj = _json_request(
        sync_url,
        "POST",
        token,
        {
            "payloads": payloads,
            "meta": {
                "source": source,
                "runAt": run_at,
            },
        },
    )
    response = _read_json_response("POST", request_obj, timeout)
    if not response.get("ok"):
        raise PortfolioRestSyncError("POST", 0, json.dumps(response, ensure_ascii=False))
    return response
```

- [ ] **Step 4: Re-run the Python helper tests**

Run:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
python3 -m unittest tests.test_portfolio_rest_sync -v
```

Expected: PASS with `3 tests`.

- [ ] **Step 5: Record the non-git vault changes**

Run:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
python3 -m unittest tests.test_portfolio_rest_sync -v
find tests scripts -maxdepth 2 -type f | sort
```

Expected: PASS test output plus a file list containing `scripts/portfolio_rest_sync.py` and `tests/test_portfolio_rest_sync.py`. No git commit is possible because this workspace is not a git repo.

## Task 5: Rewire `project_registry_sync.py` to bootstrap and publish through REST

**Files:**
- Create: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`
- Modify: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py`
- Modify: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/portfolio_rest_sync.py`

- [ ] **Step 1: Write the failing flow tests for bootstrap, publish orchestration, and image-only commits**

```py
# /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py
from __future__ import annotations

import importlib.util
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path("/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py")


def load_module():
    spec = importlib.util.spec_from_file_location("project_registry_sync", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class ProjectRegistrySyncPortfolioTests(unittest.TestCase):
    def test_collect_portfolio_commit_paths_only_returns_generated_images(self):
        module = load_module()

        def fake_run_command(args, cwd=None):
            target = args[-1]
            if target == str(module.PORTFOLIO_GENERATED_IMAGE_ROOT):
                return " M public/images/projects/generated/jobcard/01-item.png"
            if target == module.PORTFOLIO_PROJECTS_JSON:
                return " M data/projects.json"
            if target == module.PORTFOLIO_PROJECT_SYNC_JSON:
                return " M data/project-portfolio-sync.json"
            if target == module.PORTFOLIO_HEATMAP_JSON:
                return " M data/activity-heatmap.json"
            return ""

        with patch.object(module, "run_command", side_effect=fake_run_command):
            changed = module.collect_portfolio_commit_paths(Path("/tmp/portfolio"))

        self.assertEqual(changed, [str(module.PORTFOLIO_GENERATED_IMAGE_ROOT)])

    def test_publish_portfolio_sync_skips_commit_and_push_when_rest_sync_fails(self):
        module = load_module()
        with patch.object(module, "post_portfolio_sync", side_effect=RuntimeError("boom")), patch.object(
            module, "commit_portfolio_generated_files"
        ) as commit_mock, patch.object(module, "push_portfolio_repo") as push_mock:
            result = module.publish_portfolio_sync(
                sync_url="https://portfolio.example.com/api/internal/sync/portfolio",
                sync_token="sync-secret",
                payloads={
                    "projects": [],
                    "project-portfolio-sync": {"generatedAt": "2026-04-22T17:40:00+09:00", "projects": []},
                    "activity-heatmap": {
                        "generatedAt": "2026-04-22T17:40:00+09:00",
                        "rangeStart": "2025-04-23",
                        "rangeEnd": "2026-04-22",
                        "summary": {
                            "activeDays": 0,
                            "companyActiveDays": 0,
                            "personalActiveDays": 0,
                            "totalCompanyCommits": 0,
                            "totalPersonalCommits": 0,
                            "totalCommits": 0,
                            "latestActiveDate": None,
                        },
                        "weeks": [],
                    },
                },
                generated_at=datetime.fromisoformat("2026-04-22T17:40:00+09:00"),
                portfolio_root=Path("/tmp/portfolio"),
                commit_portfolio=True,
                push_portfolio=True,
            )

        commit_mock.assert_not_called()
        push_mock.assert_not_called()
        self.assertEqual(result["sync_status"], "failed: boom")
        self.assertEqual(result["commit_status"], "skipped")
        self.assertEqual(result["push_status"], "skipped")

    def test_publish_portfolio_sync_commits_generated_images_after_rest_success(self):
        module = load_module()
        with patch.object(
            module,
            "post_portfolio_sync",
            return_value={
                "ok": True,
                "updatedSections": [
                    "projects",
                    "project-portfolio-sync",
                    "activity-heatmap",
                ],
                "updatedAtBySection": {
                    "projects": "2026-04-22T08:40:11.123Z",
                    "project-portfolio-sync": "2026-04-22T08:40:11.123Z",
                    "activity-heatmap": "2026-04-22T08:40:11.123Z",
                },
            },
        ), patch.object(module, "commit_portfolio_generated_files", return_value="abc123"), patch.object(
            module, "push_portfolio_repo", return_value=("pushed", "abc123")
        ):
            result = module.publish_portfolio_sync(
                sync_url="https://portfolio.example.com/api/internal/sync/portfolio",
                sync_token="sync-secret",
                payloads={
                    "projects": [],
                    "project-portfolio-sync": {"generatedAt": "2026-04-22T17:40:00+09:00", "projects": []},
                    "activity-heatmap": {
                        "generatedAt": "2026-04-22T17:40:00+09:00",
                        "rangeStart": "2025-04-23",
                        "rangeEnd": "2026-04-22",
                        "summary": {
                            "activeDays": 0,
                            "companyActiveDays": 0,
                            "personalActiveDays": 0,
                            "totalCompanyCommits": 0,
                            "totalPersonalCommits": 0,
                            "totalCommits": 0,
                            "latestActiveDate": None,
                        },
                        "weeks": [],
                    },
                },
                generated_at=datetime.fromisoformat("2026-04-22T17:40:00+09:00"),
                portfolio_root=Path("/tmp/portfolio"),
                commit_portfolio=True,
                push_portfolio=True,
            )

        self.assertEqual(result["sync_status"], "ok")
        self.assertEqual(result["commit_status"], "abc123")
        self.assertEqual(result["push_status"], "abc123")
```

- [ ] **Step 2: Run the vault tests to verify they fail**

Run:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
python3 -m unittest tests.test_project_registry_sync_portfolio -v
```

Expected: FAIL with missing attributes such as `collect_portfolio_commit_paths` and `publish_portfolio_sync`.

- [ ] **Step 3: Refactor the script to use REST bootstrap and REST publication**

```py
# /Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py
import os
from portfolio_rest_sync import fetch_portfolio_seed_payloads, post_portfolio_sync


def load_existing_project_sync_lookup(existing_sync_payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    projects = existing_sync_payload.get("projects", [])
    if not isinstance(projects, list):
        return {}
    lookup: dict[str, dict[str, Any]] = {}
    for item in projects:
        if not isinstance(item, dict):
            continue
        project_key = str(item.get("projectKey", "")).strip()
        if project_key:
            lookup[project_key] = item
    return lookup


def build_generated_projects_payload(
    context: SyncContext,
    existing_projects: list[dict[str, Any]],
    project_sync_payload: dict[str, Any],
) -> list[dict[str, Any]]:
    existing_by_key = {
        normalize_project_key(project["title"]): project for project in existing_projects
    }
    existing_order = {
        normalize_project_key(project["title"]): project.get("id", index + 1)
        for index, project in enumerate(existing_projects)
    }
    sync_by_key = {
        project["projectKey"]: project
        for project in project_sync_payload["projects"]
    }

    generated_projects: list[dict[str, Any]] = []
    next_id = max((project.get("id", 0) for project in existing_projects), default=0) + 1
    for portfolio_doc in context.portfolio_docs:
        content = read_text(portfolio_doc.path)
        frontmatter, body = parse_frontmatter(content)
        stem_key = normalize_project_key(portfolio_doc.path.stem)
        sync = sync_by_key.get(stem_key, {})
        project_title = (
            frontmatter.get("title")
            or extract_heading(body)
            or existing_by_key.get(normalize_project_key(portfolio_doc.path.stem), {}).get("title")
            or portfolio_doc.path.stem
        )
        title_key = normalize_project_key(project_title)
        existing = existing_by_key.get(title_key) or existing_by_key.get(stem_key) or {}
        summary = extract_quote_summary(body) or existing.get("description", "")
        overview = extract_section(body, "프로젝트 개요")
        features_section = extract_section(body, "주요 기능")
        impact_section = extract_section(body, "성과 & 임팩트") or extract_section(body, "핵심 성과")
        troubleshooting_section = extract_section(body, "문제 해결 사례") or existing.get("star", {}).get("troubleshooting", "")
        feature_list = extract_feature_list(features_section) or existing.get("features", [])
        tech_stack = frontmatter.get("tech", []) or existing.get("techStack", [])
        thumbnail = sync.get("thumbnail") or existing.get("thumbnail", "")
        screenshots = sync.get("screenshots") or existing.get("screenshots", [])
        github_url = extract_first_url_from_labeled_lines(body, ("GitHub", "Repository"))
        deploy_url = extract_first_url_from_labeled_lines(body, ("배포 URL", "배포"))

        project_payload: dict[str, Any] = {
            "id": existing_order.get(title_key) or existing_order.get(stem_key) or next_id,
            "title": project_title,
            "period": frontmatter.get("period", existing.get("period", "")),
            "description": summary,
            "features": feature_list,
            "techStack": tech_stack,
            "githubUrl": github_url or existing.get("githubUrl", ""),
            "isMain": existing.get("isMain", True),
            "thumbnail": thumbnail,
            "screenshots": screenshots,
            "shortDescription": summary or existing.get("shortDescription", ""),
            "star": {
                "summary": summary,
                "role": frontmatter.get("role", existing.get("star", {}).get("role", "")),
                "background": overview or existing.get("star", {}).get("background", ""),
                "solutions": features_section or existing.get("star", {}).get("solutions", ""),
                "results": impact_section or existing.get("star", {}).get("results", ""),
            },
        }
        if deploy_url:
            project_payload["deployUrl"] = deploy_url
        elif existing.get("deployUrl"):
            project_payload["deployUrl"] = existing["deployUrl"]
        if troubleshooting_section:
            project_payload["star"]["troubleshooting"] = troubleshooting_section

        generated_projects.append(project_payload)
        if stem_key not in existing_order and title_key not in existing_order:
            next_id += 1

    generated_projects.sort(key=lambda project: project.get("id", 0))
    return generated_projects


def build_portfolio_project_sync_payload(
    context: SyncContext,
    generated_at: datetime,
    existing_sync_payload: dict[str, Any],
    vault_root: Path,
    screenshot_asset_values: dict[str, dict[str, str]],
    screenshot_inbox_path: Path,
    portfolio_root: Path,
) -> dict[str, Any]:
    existing_sync_by_key = load_existing_project_sync_lookup(existing_sync_payload)
    doc_to_project: dict[str, ProjectDoc] = {}
    for project in context.project_docs:
        for portfolio_path in project.portfolio_matches:
            doc_to_project[str(portfolio_path)] = project

    payload_projects: list[dict[str, Any]] = []
    for portfolio_doc in context.portfolio_docs:
        content = read_text(portfolio_doc.path)
        frontmatter, body = parse_frontmatter(content)
        project_title = (
            frontmatter.get("title") or extract_heading(body) or portfolio_doc.path.stem
        )
        normalized_key = normalize_project_key(portfolio_doc.path.stem)
        existing_sync = existing_sync_by_key.get(normalized_key, {})
        project_doc = doc_to_project.get(str(portfolio_doc.path))
        linked_repos = merge_portfolio_linked_repos(portfolio_doc, project_doc)
        last_authored_commit_at = max(
            (repo.last_authored_commit_at for repo in linked_repos if repo.last_authored_commit_at),
            default=None,
        )
        today_commit_count = sum(len(repo.today_commits) for repo in linked_repos)
        screenshot_assets = resolve_screenshot_assets_from_inbox(
            screenshot_asset_values.get(normalized_key, {}),
            screenshot_inbox_path,
            vault_root,
        )
        thumbnail, screenshots = sync_screenshot_assets(
            normalized_key,
            screenshot_assets,
            portfolio_root,
        )
        if screenshot_assets and not screenshots and existing_sync:
            thumbnail = str(existing_sync.get("thumbnail", ""))
            existing_screenshots = existing_sync.get("screenshots", [])
            screenshots = existing_screenshots if isinstance(existing_screenshots, list) else []

        payload_projects.append(
            {
                "projectKey": normalized_key,
                "projectTitle": project_title,
                "sourceDoc": str(portfolio_doc.path),
                "sourceDocRelative": portfolio_doc.path.relative_to(portfolio_doc.path.parent).as_posix(),
                "headline": extract_heading(body),
                "summary": extract_quote_summary(body),
                "status": frontmatter.get("status", ""),
                "period": frontmatter.get("period", ""),
                "company": frontmatter.get("company", ""),
                "role": frontmatter.get("role", ""),
                "teamSize": str(frontmatter.get("team_size", "")),
                "updated": str(frontmatter.get("updated", "")),
                "tech": frontmatter.get("tech", []),
                "track": aggregate_tracks(linked_repos),
                "todayCommitCount": today_commit_count,
                "lastAuthoredCommitAt": format_timestamp(last_authored_commit_at),
                "linkedRepos": [repo.path.name for repo in linked_repos],
                "recentUpdates": extract_section(body, "최근 업데이트"),
                "portfolioNotes": extract_section(body, "포트폴리오 반영 메모"),
                "thumbnail": thumbnail,
                "screenshots": screenshots,
                "screenshotCount": len(screenshots),
            }
        )

    payload_projects.sort(key=lambda item: item["projectTitle"].lower())
    return {
        "generatedAt": generated_at.isoformat(),
        "projects": payload_projects,
    }


def collect_portfolio_commit_paths(portfolio_root: Path) -> list[str]:
    generated_image_root = str(PORTFOLIO_GENERATED_IMAGE_ROOT)
    if run_command(["git", "-C", str(portfolio_root), "status", "--short", "--", generated_image_root]):
        return [generated_image_root]
    return []


def commit_portfolio_generated_files(portfolio_root: Path, generated_at: datetime) -> Optional[str]:
    changed_paths = collect_portfolio_commit_paths(portfolio_root)
    if not changed_paths:
        return None

    run_command(["git", "-C", str(portfolio_root), "add", "--", *changed_paths])
    message = f"chore: sync portfolio generated images {generated_at.strftime('%Y-%m-%d')}"
    completed = subprocess.run(
        ["git", "-C", str(portfolio_root), "commit", "-m", message, "--", *changed_paths],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        return None
    return run_command(["git", "-C", str(portfolio_root), "rev-parse", "--short", "HEAD"])


def publish_portfolio_sync(
    *,
    sync_url: str,
    sync_token: str,
    payloads: dict[str, Any],
    generated_at: datetime,
    portfolio_root: Path,
    commit_portfolio: bool,
    push_portfolio: bool,
) -> dict[str, Any]:
    try:
        response = post_portfolio_sync(
            sync_url,
            sync_token,
            payloads,
            source="daily-project-sync",
            run_at=generated_at.isoformat(),
        )
    except Exception as exc:
        return {
            "sync_status": f"failed: {exc}",
            "updated_at_by_section": {},
            "commit_status": "skipped",
            "push_status": "skipped",
        }

    commit_status = "skipped"
    push_status = "skipped"

    if commit_portfolio:
        committed_hash = commit_portfolio_generated_files(portfolio_root, generated_at)
        commit_status = committed_hash or "no changes"

    if push_portfolio and commit_status not in {"skipped", "no changes"}:
        push_state, push_detail = push_portfolio_repo(portfolio_root)
        if push_state == "pushed":
            push_status = push_detail
        elif push_state == "failed":
            push_status = f"failed: {push_detail}"
        elif push_state == "blocked":
            push_status = f"blocked: {push_detail}"
        else:
            push_status = push_state

    return {
        "sync_status": "ok",
        "updated_at_by_section": response.get("updatedAtBySection", {}),
        "commit_status": commit_status,
        "push_status": push_status,
    }
```

- [ ] **Step 4: Update `main()` and CLI args to fetch bootstrap sections before payload generation**

```py
# /Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py
parser.add_argument(
    "--portfolio-sync-url",
    default=os.environ.get("PORTFOLIO_SYNC_API_URL", ""),
    help="REST endpoint for portfolio section sync.",
)
parser.add_argument(
    "--portfolio-sync-token-env",
    default="PORTFOLIO_SYNC_API_TOKEN",
    help="Environment variable name that stores the portfolio sync bearer token.",
)
```

```py
existing_bootstrap_payloads = fetch_portfolio_seed_payloads(
    args.portfolio_sync_url,
    os.environ[args.portfolio_sync_token_env],
)

project_sync_payload = build_portfolio_project_sync_payload(
    context,
    generated_at,
    existing_bootstrap_payloads["project-portfolio-sync"],
    vault_root,
    screenshot_asset_values,
    screenshot_inbox_path,
    portfolio_root,
)
generated_projects_payload = build_generated_projects_payload(
    context,
    existing_bootstrap_payloads["projects"],
    project_sync_payload,
)

portfolio_sync_result = publish_portfolio_sync(
    sync_url=args.portfolio_sync_url,
    sync_token=os.environ[args.portfolio_sync_token_env],
    payloads={
        "projects": generated_projects_payload,
        "project-portfolio-sync": project_sync_payload,
        "activity-heatmap": heatmap_payload,
    },
    generated_at=generated_at,
    portfolio_root=portfolio_root,
    commit_portfolio=args.commit_portfolio,
    push_portfolio=args.push_portfolio,
)

print(f"Portfolio REST sync: {portfolio_sync_result['sync_status']}")
print(f"Portfolio section updatedAt: {portfolio_sync_result['updated_at_by_section']}")
print(f"Portfolio commit: {portfolio_sync_result['commit_status']}")
print(f"Portfolio push: {portfolio_sync_result['push_status']}")
```

- [ ] **Step 5: Run the full vault unit test suite**

Run:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
python3 -m unittest tests.test_portfolio_rest_sync tests.test_project_registry_sync_portfolio -v
```

Expected: PASS with both REST helper and flow tests.

- [ ] **Step 6: Run a smoke test against a local portfolio server**

Run:

```bash
cd /Users/seungkyu/Documents/ysk9926/portfolio
PORTFOLIO_SYNC_API_TOKEN=dev-sync-token SUPABASE_DB_URL="$SUPABASE_DB_URL" npm run dev
```

In a second terminal:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
PORTFOLIO_SYNC_API_URL='http://localhost:3000/api/internal/sync/portfolio' \
PORTFOLIO_SYNC_API_TOKEN='dev-sync-token' \
python3 scripts/project_registry_sync.py \
  --vault-root '/Users/seungkyu/Documents/Obsidian Vault/02-Projects' \
  --scan-root '/Users/seungkyu/Documents' \
  --portfolio-root '/Users/seungkyu/Documents/ysk9926/portfolio'
```

Expected:

- `Portfolio REST sync: ok`
- `Portfolio section updatedAt:` prints timestamps for the three sections
- `git -C /Users/seungkyu/Documents/ysk9926/portfolio status --short` shows only changed generated images, or nothing

- [ ] **Step 7: Record the final vault-side change set**

Run:

```bash
cd '/Users/seungkyu/Documents/Obsidian Vault/02-Projects'
find scripts tests -maxdepth 2 -type f | sort
```

Expected: output includes the new REST helper, both Python test files, and the modified `project_registry_sync.py`. No git commit is possible here because the vault is not a git repo.

## Self-Review Checklist

- Spec coverage:
  - Token-protected REST publication: Task 1 + Task 3 + Task 5
  - One transaction for the three sections: Task 2
  - Commit only generated images: Task 5
  - Obsidian note/index flow preserved: Task 5 leaves the note sync path intact and changes only the portfolio publication path
  - Testing: Task 1, Task 2, Task 3, Task 4, Task 5
- Placeholder scan:
  - No `TBD`, `TODO`, or vague “handle appropriately” instructions remain
  - Commands are concrete and file paths are exact
- Type consistency:
  - Shared section key names come from `portfolioSyncSectionKeys`
  - POST request body shape matches the approved spec
  - Python helper names align with the new orchestration functions in `project_registry_sync.py`
