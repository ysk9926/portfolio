import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';
import type { SectionKey } from '../../lib/types/payload';

const sectionFileMap: Record<SectionKey, string> = {
  site: 'site.json',
  about: 'about.json',
  skills: 'skills.json',
  archiving: 'archiving.json',
  career: 'career.json',
  projects: 'projects.json',
  'project-portfolio-sync': 'project-portfolio-sync.json',
  'activity-heatmap': 'activity-heatmap.json',
};

const sectionOrder: SectionKey[] = [
  'site',
  'about',
  'skills',
  'archiving',
  'career',
  'projects',
  'project-portfolio-sync',
  'activity-heatmap',
];

if (!process.env.SUPABASE_DB_URL) {
  throw new Error('Missing env: SUPABASE_DB_URL');
}

const canonicalize = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map(canonicalize);
  }

  if (input && typeof input === 'object') {
    const entries = Object.entries(input as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, canonicalize(value)] as const);

    return Object.fromEntries(entries);
  }

  return input;
};

const findFirstDiff = (
  expected: unknown,
  actual: unknown,
  prefix = '$',
): string | null => {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      return `${prefix}: array length mismatch (${expected.length} vs ${actual.length})`;
    }

    for (let index = 0; index < expected.length; index += 1) {
      const child = findFirstDiff(expected[index], actual[index], `${prefix}[${index}]`);
      if (child) return child;
    }
    return null;
  }

  if (
    expected &&
    actual &&
    typeof expected === 'object' &&
    typeof actual === 'object' &&
    !Array.isArray(expected) &&
    !Array.isArray(actual)
  ) {
    const expectedKeys = Object.keys(expected as Record<string, unknown>).sort();
    const actualKeys = Object.keys(actual as Record<string, unknown>).sort();

    if (expectedKeys.join('|') !== actualKeys.join('|')) {
      return `${prefix}: object keys mismatch (${expectedKeys.join(',')} vs ${actualKeys.join(',')})`;
    }

    for (const key of expectedKeys) {
      const child = findFirstDiff(
        (expected as Record<string, unknown>)[key],
        (actual as Record<string, unknown>)[key],
        `${prefix}.${key}`,
      );
      if (child) return child;
    }

    return null;
  }

  if (expected !== actual) {
    return `${prefix}: value mismatch (${JSON.stringify(expected)} vs ${JSON.stringify(actual)})`;
  }

  return null;
};

const run = async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();

  let failed = false;
  const expectedBySection: Partial<Record<SectionKey, unknown>> = {};

  try {
    for (const sectionKey of sectionOrder) {
      const filePath = path.join(process.cwd(), 'data', sectionFileMap[sectionKey]);
      const expectedRaw = await fs.readFile(filePath, 'utf8');
      const expected = JSON.parse(expectedRaw);
      expectedBySection[sectionKey] = expected;

      const query = await client.query<{
        payload: unknown;
      }>('select public.export_section_payload($1) as payload', [sectionKey]);

      const actual = query.rows[0]?.payload;
      const expectedCanonical = canonicalize(expected);
      const actualCanonical = canonicalize(actual);

      const expectedSerialized = JSON.stringify(expectedCanonical);
      const actualSerialized = JSON.stringify(actualCanonical);

      if (expectedSerialized !== actualSerialized) {
        failed = true;
        const diff = findFirstDiff(expectedCanonical, actualCanonical) ?? 'unknown diff';
        console.error(`❌ ${sectionKey}: mismatch`);
        console.error(`   ${diff}`);
      } else {
        console.log(`✅ ${sectionKey}: match`);
      }
    }

    const countQuery = await client.query<{
      site_nav_count: number;
      about_items_count: number;
      skills_categories_count: number;
      skills_items_count: number;
      archiving_items_count: number;
      archiving_details_count: number;
      career_entries_count: number;
      career_achievements_count: number;
      projects_count: number;
      project_features_count: number;
      project_tech_count: number;
      project_screenshots_count: number;
      project_stars_count: number;
      sync_entries_count: number;
      sync_tech_count: number;
      sync_repos_count: number;
      sync_screenshots_count: number;
      activity_weeks_count: number;
      activity_days_count: number;
      activity_refs_count: number;
    }>(`
      select
        (select count(*)::int from public.site_nav) as site_nav_count,
        (select count(*)::int from public.about_items) as about_items_count,
        (select count(*)::int from public.skills_categories) as skills_categories_count,
        (select count(*)::int from public.skills_items) as skills_items_count,
        (select count(*)::int from public.archiving_items) as archiving_items_count,
        (select count(*)::int from public.archiving_details) as archiving_details_count,
        (select count(*)::int from public.career_entries) as career_entries_count,
        (select count(*)::int from public.career_achievements) as career_achievements_count,
        (select count(*)::int from public.projects) as projects_count,
        (select count(*)::int from public.project_features) as project_features_count,
        (select count(*)::int from public.project_tech_stacks) as project_tech_count,
        (select count(*)::int from public.project_screenshots) as project_screenshots_count,
        (select count(*)::int from public.project_stars) as project_stars_count,
        (select count(*)::int from public.project_portfolio_sync_entries) as sync_entries_count,
        (select count(*)::int from public.project_portfolio_sync_tech) as sync_tech_count,
        (select count(*)::int from public.project_portfolio_sync_linked_repos) as sync_repos_count,
        (select count(*)::int from public.project_portfolio_sync_screenshots) as sync_screenshots_count,
        (select count(*)::int from public.activity_heatmap_weeks) as activity_weeks_count,
        (select count(*)::int from public.activity_heatmap_days) as activity_days_count,
        (select count(*)::int from public.activity_heatmap_day_project_refs) as activity_refs_count
    `);

    const counts = countQuery.rows[0];
    const assertCount = (label: string, expected: number, actual: number) => {
      if (expected !== actual) {
        failed = true;
        console.error(`❌ count mismatch: ${label} (${expected} vs ${actual})`);
      } else {
        console.log(`✅ count check: ${label} (${actual})`);
      }
    };

    const expectedSite = expectedBySection.site as {
      nav: unknown[];
    };
    const expectedAbout = expectedBySection.about as unknown[];
    const expectedSkills = expectedBySection.skills as Array<{
      skills: unknown[];
    }>;
    const expectedArchiving = expectedBySection.archiving as Array<{
      details: unknown[];
    }>;
    const expectedCareer = expectedBySection.career as Array<{
      achievements: unknown[];
    }>;
    const expectedProjects = expectedBySection.projects as Array<{
      features: unknown[];
      techStack: unknown[];
      screenshots: unknown[];
      star?: unknown;
    }>;
    const expectedSync = expectedBySection['project-portfolio-sync'] as {
      projects: Array<{
        tech: unknown[];
        linkedRepos: unknown[];
        screenshots: unknown[];
      }>;
    };
    const expectedActivity = expectedBySection['activity-heatmap'] as {
      weeks: Array<{
        days: Array<{
          companyProjects: unknown[];
          personalProjects: unknown[];
        }>;
      }>;
    };

    assertCount('site_nav', expectedSite.nav.length, counts.site_nav_count);
    assertCount('about_items', expectedAbout.length, counts.about_items_count);
    assertCount(
      'skills_categories',
      expectedSkills.length,
      counts.skills_categories_count,
    );
    assertCount(
      'skills_items',
      expectedSkills.reduce((acc, category) => acc + category.skills.length, 0),
      counts.skills_items_count,
    );
    assertCount(
      'archiving_items',
      expectedArchiving.length,
      counts.archiving_items_count,
    );
    assertCount(
      'archiving_details',
      expectedArchiving.reduce((acc, item) => acc + item.details.length, 0),
      counts.archiving_details_count,
    );
    assertCount('career_entries', expectedCareer.length, counts.career_entries_count);
    assertCount(
      'career_achievements',
      expectedCareer.reduce((acc, entry) => acc + entry.achievements.length, 0),
      counts.career_achievements_count,
    );
    assertCount('projects', expectedProjects.length, counts.projects_count);
    assertCount(
      'project_features',
      expectedProjects.reduce((acc, project) => acc + project.features.length, 0),
      counts.project_features_count,
    );
    assertCount(
      'project_tech_stacks',
      expectedProjects.reduce((acc, project) => acc + project.techStack.length, 0),
      counts.project_tech_count,
    );
    assertCount(
      'project_screenshots',
      expectedProjects.reduce((acc, project) => acc + project.screenshots.length, 0),
      counts.project_screenshots_count,
    );
    assertCount(
      'project_stars',
      expectedProjects.reduce((acc, project) => acc + (project.star ? 1 : 0), 0),
      counts.project_stars_count,
    );
    assertCount(
      'sync_entries',
      expectedSync.projects.length,
      counts.sync_entries_count,
    );
    assertCount(
      'sync_tech',
      expectedSync.projects.reduce((acc, entry) => acc + entry.tech.length, 0),
      counts.sync_tech_count,
    );
    assertCount(
      'sync_linked_repos',
      expectedSync.projects.reduce((acc, entry) => acc + entry.linkedRepos.length, 0),
      counts.sync_repos_count,
    );
    assertCount(
      'sync_screenshots',
      expectedSync.projects.reduce((acc, entry) => acc + entry.screenshots.length, 0),
      counts.sync_screenshots_count,
    );
    assertCount(
      'activity_weeks',
      expectedActivity.weeks.length,
      counts.activity_weeks_count,
    );
    assertCount(
      'activity_days',
      expectedActivity.weeks.reduce((acc, week) => acc + week.days.length, 0),
      counts.activity_days_count,
    );
    assertCount(
      'activity_refs',
      expectedActivity.weeks.reduce(
        (total, week) =>
          total +
          week.days.reduce(
            (acc, day) => acc + day.companyProjects.length + day.personalProjects.length,
            0,
          ),
        0,
      ),
      counts.activity_refs_count,
    );
  } finally {
    await client.end();
  }

  if (failed) {
    process.exitCode = 1;
    throw new Error('Roundtrip verification failed');
  }

  console.log('Roundtrip verification complete');
};

void run();
