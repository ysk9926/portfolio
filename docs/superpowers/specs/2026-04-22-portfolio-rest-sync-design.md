# Portfolio REST Sync Design

Date: 2026-04-22
Owner: Codex
Status: Approved for planning

## Context

The portfolio site no longer treats `data/projects.json`, `data/project-portfolio-sync.json`, and `data/activity-heatmap.json` as the long-term source of truth. Site reads already flow through Supabase via `export_section_payload()`, and the admin editor already persists section updates through `admin_replace_section()`.

The remaining gap is the daily automation in the Obsidian vault:

- It still generates the three portfolio payloads locally.
- It still assumes file-based publication in the portfolio repo.
- It still decides commit/push based on generated JSON file changes.

This creates a mismatch between the runtime read path and the automation write path.

## Goals

- Move automated portfolio updates from file publication to REST-based DB publication.
- Keep the existing Obsidian note/index/screenshot inbox sync behavior.
- Reuse the existing section schemas and `admin_replace_section()` DB write logic.
- Support one authenticated batch update for `projects`, `project-portfolio-sync`, and `activity-heatmap`.
- Keep generated screenshots as repo-managed static assets under `public/images/projects/generated/**`.
- Change portfolio repo commits so they only happen when generated image assets actually change.

## Non-Goals

- Reworking the admin UI editing flow.
- Replacing Supabase with another backend.
- Moving generated screenshots into DB or object storage in this change.
- Changing the structure of the existing section payload schemas unless validation reveals a concrete mismatch.

## Current State

### Read path

- The public site loads section payloads through [`lib/portfolio-data/server.ts`](/Users/seungkyu/Documents/ysk9926/portfolio/lib/portfolio-data/server.ts).
- The server uses `export_section_payload(sectionKey)` via Supabase RPC.
- `projects`, `project-portfolio-sync`, and `activity-heatmap` are already part of that DB-backed read path.

### Manual write path

- The admin editor calls [`/api/admin/sections/[sectionKey]`](/Users/seungkyu/Documents/ysk9926/portfolio/app/api/admin/sections/[sectionKey]/route.ts).
- That route validates payloads with `sectionPayloadSchemaMap` and persists through `admin_replace_section()`.
- This path depends on authenticated browser sessions and admin membership in `admin_users`.

### Automated write path

- [`project_registry_sync.py`](/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py) generates:
  - `projects`
  - `project-portfolio-sync`
  - `activity-heatmap`
- It currently writes those payloads into portfolio repo files and uses git status to decide whether to commit/push.
- Screenshot assets are copied into `public/images/projects/generated/**`, which the site references directly.

## Chosen Approach

Implement a dedicated internal REST endpoint for automation:

- Route: `POST /api/internal/sync/portfolio`
- Auth: static Bearer token via `PORTFOLIO_SYNC_API_TOKEN`
- Request body: batch payload containing the three portfolio sections
- Validation: reuse `sectionPayloadSchemaMap`
- Persistence: server-side transaction using `pg` and `SUPABASE_DB_URL`
- DB write primitive: existing `public.admin_replace_section(text, jsonb)`

This route is separate from the admin session route on purpose:

- Admin editing and automation have different trust models.
- The admin route should stay cookie/session based.
- Automation should not depend on browser auth, Supabase SSR cookies, or `admin_users`.

## API Design

### Endpoint

`POST /api/internal/sync/portfolio`

### Authentication

Required header:

```http
Authorization: Bearer <PORTFOLIO_SYNC_API_TOKEN>
```

Rules:

- Missing header returns `401`.
- Wrong token returns `403`.
- Token auth is the only accepted auth mode for this route.
- This route does not inspect session cookies.

### Request payload

```json
{
  "payloads": {
    "projects": [...],
    "project-portfolio-sync": {
      "generatedAt": "...",
      "projects": [...]
    },
    "activity-heatmap": {
      "generatedAt": "...",
      "rangeStart": "...",
      "rangeEnd": "...",
      "summary": {},
      "weeks": []
    }
  },
  "meta": {
    "source": "daily-project-sync",
    "runAt": "2026-04-22T17:40:00+09:00"
  }
}
```

`meta` is informational only. The canonical persisted data is the section payloads.

### Validation

- `projects` uses `sectionPayloadSchemaMap.projects`
- `project-portfolio-sync` uses `sectionPayloadSchemaMap['project-portfolio-sync']`
- `activity-heatmap` uses `sectionPayloadSchemaMap['activity-heatmap']`

If any one section fails validation:

- Return `400`
- Do not write anything
- Include section-specific validation failure details

### Response

Success response shape:

```json
{
  "ok": true,
  "updatedSections": [
    "projects",
    "project-portfolio-sync",
    "activity-heatmap"
  ],
  "updatedAtBySection": {
    "projects": "2026-04-22T08:40:11.123Z",
    "project-portfolio-sync": "2026-04-22T08:40:11.123Z",
    "activity-heatmap": "2026-04-22T08:40:11.123Z"
  }
}
```

Failure response shape:

```json
{
  "ok": false,
  "error": "Failed to sync portfolio sections",
  "section": "project-portfolio-sync",
  "details": "..."
}
```

The route should not echo the full payload back to the caller.

## Server Write Path

### Write client

The new internal sync route will not use the existing Supabase SSR client because:

- it is configured with publishable credentials,
- it assumes cookie-backed sessions,
- automation is a server-to-server caller.

Instead, the route will create a direct Postgres client with `pg` using `SUPABASE_DB_URL`.

### Transaction model

All three section writes will execute inside one SQL transaction:

1. `begin`
2. `select public.admin_replace_section('projects', $1::jsonb)`
3. `select public.admin_replace_section('project-portfolio-sync', $2::jsonb)`
4. `select public.admin_replace_section('activity-heatmap', $3::jsonb)`
5. `commit`

If any one step fails:

- `rollback`
- return an error response
- skip any downstream automation commit/push action

This preserves section-to-section consistency for a single automation run.

## Automation Changes

### Obsidian-side behavior that remains

[`project_registry_sync.py`](/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py) still:

- scans repos under `/Users/seungkyu/Documents`
- updates `프로젝트 인덱스.md`
- patches generated sections in linked project notes
- refreshes `portfolio/스크린샷 인박스.md`
- copies referenced images into `public/images/projects/generated/**`
- generates in-memory payloads for:
  - `projects`
  - `project-portfolio-sync`
  - `activity-heatmap`

### Obsidian-side behavior that changes

The script will stop treating these as published file outputs:

- `data/projects.json`
- `data/project-portfolio-sync.json`
- `data/activity-heatmap.json`

Instead it will:

1. generate the payloads in memory
2. sync images into the portfolio repo
3. call `POST /api/internal/sync/portfolio`
4. commit/push the portfolio repo only if generated image assets changed and the REST sync succeeded

### New script configuration

The automation script will accept configuration for:

- `--portfolio-sync-url`
- `--portfolio-sync-token-env`

Default behavior:

- URL defaults to environment variable `PORTFOLIO_SYNC_API_URL`
- token defaults to environment variable `PORTFOLIO_SYNC_API_TOKEN`

This keeps secrets out of the script arguments and git history.

## Image Sync and Commit Rules

### Images remain file-based

Generated public screenshots stay in the repo:

- path: `public/images/projects/generated/**`
- reason: the portfolio payloads already refer to static web paths under `/images/projects/generated/...`

This means image copy remains part of the automation.

### Commit rule

Portfolio repo commit/push behavior changes to:

- do not commit `data/*.json` as part of daily sync
- do commit `public/images/projects/generated/**` only when those files actually changed
- only commit/push after the REST sync succeeds

Rationale:

- DB is now the source of truth for the three synced sections
- repo history should only track actual static asset changes from automation

## Error Handling

### Route errors

- `401` for missing auth header
- `403` for invalid token
- `400` for payload validation failure
- `500` for DB or transaction errors

### Automation errors

Classify failures into three groups:

1. Vault update failure
2. Image sync failure
3. REST sync failure

Behavior:

- Vault note/index updates still run independently.
- Image copy failures are recorded explicitly in the summary.
- REST sync failure is terminal for portfolio publication.
- On REST sync failure, portfolio repo commit/push is skipped even if image files changed.

## Reporting Changes

The automation inbox/report output should replace JSON-file-centric reporting with REST-centric reporting:

- include REST sync result: success/failure
- include section-level `updatedAt` values when successful
- include screenshot/image sync result
- include commit result
- include push result
- include unresolved mapping candidates

## Testing Strategy

### Portfolio app

Add coverage for:

- internal sync route auth checks
- section-level validation failures
- happy-path batch transaction
- rollback behavior when one section write fails

### Automation script

Verify:

- payload generation remains unchanged in shape
- REST request body matches the new contract
- script exits/reporting behave correctly on 4xx/5xx failures
- commit/push now key off image changes rather than `data/*.json`

### Existing Supabase verification script

[`scripts/supabase/verify-roundtrip.ts`](/Users/seungkyu/Documents/ysk9926/portfolio/scripts/supabase/verify-roundtrip.ts) remains a manual DB export verification tool in this change. It must no longer be treated as proof that daily sync wrote fresh local JSON files, and it is not part of the automated publication path.

## Implementation Plan Boundaries

Implementation should be split into these units:

1. Portfolio server utilities for internal token auth and DB write client
2. Internal portfolio sync route
3. Obsidian automation script REST publication changes
4. Portfolio commit/push rule update
5. Verification and reporting updates

## Risks

- `SUPABASE_DB_URL` must be available in the deployed server environment for the internal sync route.
- If `PORTFOLIO_SYNC_API_TOKEN` is missing in either automation or server environment, sync will fail hard.
- Image copy and DB publication are not one atomic system transaction because the filesystem and DB are separate systems. The chosen mitigation is to require REST success before commit/push.

## Final Decision

Adopt a dedicated token-protected internal REST sync endpoint that batch-updates `projects`, `project-portfolio-sync`, and `activity-heatmap` through `admin_replace_section()` in one DB transaction, while keeping generated screenshots as file-based assets and limiting portfolio repo commits to actual generated image changes.
