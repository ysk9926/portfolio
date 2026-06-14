# Public Portfolio Anonymization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Obsidian and internal identifiers intact while anonymizing every company-project field that reaches the public portfolio payloads and UI.

**Architecture:** Add a public-only anonymization layer inside the daily sync script so `projects`, `project-portfolio-sync`, and `activity-heatmap` all derive company project display names and summaries from one shared profile helper. Tests expand around payload generation and heatmap serialization so future syncs cannot regress and leak real customer names.

**Tech Stack:** Python 3, unittest, existing Obsidian sync script, Supabase-backed portfolio payload pipeline

---

### Task 1: Add anonymization helpers and profile overrides

**Files:**
- Modify: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py`
- Test: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 1: Write failing tests for public profile inference**

Add tests that assert company projects get anonymized public titles and company labels while personal projects keep original titles.

- [ ] **Step 2: Run targeted tests to verify the new assertions fail**

Run: `python3 -m unittest /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 3: Implement shared public profile helpers**

Add a `PUBLIC_PROJECT_OVERRIDES` mapping and helper functions that return public title, summary, company label, and whether a project should keep detailed STAR content.

- [ ] **Step 4: Re-run tests**

Run: `python3 -m unittest /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 5: Commit**

```bash
git -C /Users/seungkyu/Documents/ysk9926/portfolio add docs/superpowers/plans/2026-05-29-public-portfolio-anonymization.md
git -C /Users/seungkyu/Documents/Obsidian\ Vault/02-Projects add scripts/project_registry_sync.py tests/test_project_registry_sync_portfolio.py
git commit -m "feat: anonymize public company project payloads"
```

### Task 2: Apply anonymization to projects and project-portfolio-sync payloads

**Files:**
- Modify: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py`
- Test: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 1: Add failing payload tests**

Cover `build_generated_projects_payload()` and `build_portfolio_project_sync_payload()` so company projects emit anonymized `title`, `description`, `shortDescription`, `star.summary`, `projectTitle`, `headline`, `summary`, and `company`.

- [ ] **Step 2: Run targeted tests**

Run: `python3 -m unittest /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 3: Implement payload anonymization**

Reuse the shared helper inside both payload builders, and replace detailed STAR sections for company projects with safe generated content instead of raw Obsidian body sections.

- [ ] **Step 4: Re-run targeted tests**

Run: `python3 -m unittest /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

### Task 3: Apply anonymization to activity heatmap and verify end-to-end sync

**Files:**
- Modify: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py`
- Test: `/Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 1: Add failing heatmap test**

Assert that company activity names are anonymized while personal activity names remain unchanged.

- [ ] **Step 2: Run targeted tests**

Run: `python3 -m unittest /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py`

- [ ] **Step 3: Implement heatmap name rewriting**

Map company bucket names through the same public profile helper before serializing `companyProjects`.

- [ ] **Step 4: Run all relevant tests**

Run:

```bash
python3 -m unittest \
  /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_project_registry_sync_portfolio.py \
  /Users/seungkyu/Documents/Obsidian Vault/02-Projects/tests/test_portfolio_rest_sync.py
```

- [ ] **Step 5: Run sync and verify published payloads**

Run:

```bash
python3 '/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts/project_registry_sync.py' \
  --vault-root '/Users/seungkyu/Documents/Obsidian Vault/02-Projects' \
  --scan-root '/Users/seungkyu/Documents' \
  --portfolio-root '/Users/seungkyu/Documents/ysk9926/portfolio'
```

Then verify:

```bash
python3 - <<'PY'
from pathlib import Path
import sys
sys.path.insert(0, '/Users/seungkyu/Documents/Obsidian Vault/02-Projects/scripts')
from portfolio_rest_sync import build_inprocess_sync_url, fetch_portfolio_seed_payloads
root = Path('/Users/seungkyu/Documents/ysk9926/portfolio')
payloads = fetch_portfolio_seed_payloads(build_inprocess_sync_url(root), 'daily-project-sync-inprocess')
print(payloads['projects'][0].keys())
PY
```

Expected: no public company project entries expose customer names in `projects`, `project-portfolio-sync`, or `activity-heatmap`.
