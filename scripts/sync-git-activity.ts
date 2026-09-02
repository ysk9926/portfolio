import { Client } from 'pg';

import {
  activityHeatmapPayloadSchema,
  type ActivityHeatmapPayload,
} from '../lib/types/payload';

type Track = '회사' | '개인';
type Repo = { name: string; identity: string; track: Track };
type Commit = { hash: string; date: string };

// The activity heatmap is sourced from the ERP project-records (gitlog) DB,
// which stores every collected commit per repository. We read those commits
// instead of scanning the local filesystem so repositories that never lived on
// this machine still count toward the heatmap.
const gitAuthorNames = ['ysk9926', 'tmdrb9926'];

// Personal repositories all live under the author's personal GitHub account
// (git@github-ysk9926:ysk9926/… or …/ysk9926/…). Everything else — the
// Pooolingforest / poooling-* / owl-* / client organizations — is company work.
// A repository without a remote is a local-only experiment, treated as personal.
const trackOf = (remoteUrl: string | null): Track => {
  if (!remoteUrl) return '개인';
  if (/[:/]ysk9926\//.test(remoteUrl)) return '개인';
  return '회사';
};

const isDryRun = process.argv.includes('--dry-run');

const kstDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const addDays = (date: string, amount: number) => {
  const value = new Date(`${date}T00:00:00+09:00`);
  value.setUTCDate(value.getUTCDate() + amount);
  return kstDate(value);
};

type RepoWithCommits = { repo: Repo; commits: Commit[] };

// Read the author's own commits from the gitlog DB and group them by repository,
// deriving the company/personal track from each repository's remote URL.
const readReposFromGitlog = async (): Promise<RepoWithCommits[]> => {
  const connectionString = process.env.GITLOG_DATABASE_URL;
  if (!connectionString) throw new Error('Missing GITLOG_DATABASE_URL');
  // Supabase's pooler presents a certificate chain node cannot verify against
  // the system roots, so require TLS but skip chain verification.
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query<{
      slug: string;
      remote_url: string | null;
      sha: string;
      committed_at: Date;
    }>(
      `select r.slug, r.remote_url, c.sha, c.committed_at
         from public.git_commits c
         join public.project_repositories r on r.id = c.repository_id
        where c.author_name = any($1::text[])
          and c.committed_at >= now() - interval '400 days'`,
      [gitAuthorNames],
    );

    const byRepo = new Map<string, RepoWithCommits>();
    for (const row of rows) {
      const entry =
        byRepo.get(row.slug) ??
        ({
          repo: { name: row.slug, identity: row.slug, track: trackOf(row.remote_url) },
          commits: [],
        } satisfies RepoWithCommits);
      entry.commits.push({ hash: row.sha, date: row.committed_at.toISOString() });
      byRepo.set(row.slug, entry);
    }
    return [...byRepo.values()];
  } finally {
    await client.end();
  }
};

const intensity = (count: number) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
};

const buildPayload = (repos: RepoWithCommits[]): ActivityHeatmapPayload => {
  const rangeEnd = kstDate(new Date());
  const rangeStart = addDays(rangeEnd, -364);
  const byDate = new Map<
    string,
    { company: Map<string, number>; personal: Map<string, number> }
  >();
  const seen = new Set<string>();

  for (const { repo, commits } of repos) {
    for (const commit of commits) {
      const date = kstDate(new Date(commit.date));
      if (date < rangeStart || date > rangeEnd) continue;
      const dedupeKey = `${repo.track}:${repo.identity}:${commit.hash}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const day = byDate.get(date) ?? {
        company: new Map<string, number>(),
        personal: new Map<string, number>(),
      };
      const projects = repo.track === '회사' ? day.company : day.personal;
      projects.set(repo.name, (projects.get(repo.name) ?? 0) + 1);
      byDate.set(date, day);
    }
  }

  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rangeStartDate = new Date(`${rangeStart}T00:00:00+09:00`);
  const firstWeekStart = addDays(rangeStart, -rangeStartDate.getDay());
  const weeks: ActivityHeatmapPayload['weeks'] = [];
  let cursor = firstWeekStart;

  while (cursor <= rangeEnd) {
    const weekStart = cursor;
    const days = [];
    for (let index = 0; index < 7; index += 1) {
      const date = addDays(weekStart, index);
      const activity = byDate.get(date);
      const companyProjects = [...(activity?.company ?? new Map())]
        .map(([name, count]) => ({ name, count, track: '회사' as const }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      const personalProjects = [...(activity?.personal ?? new Map())]
        .map(([name, count]) => ({ name, count, track: '개인' as const }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      const companyCommitCount = companyProjects.reduce((sum, item) => sum + item.count, 0);
      const personalCommitCount = personalProjects.reduce((sum, item) => sum + item.count, 0);
      const totalCommitCount = companyCommitCount + personalCommitCount;
      days.push({
        date,
        weekday: weekday[new Date(`${date}T00:00:00+09:00`).getDay()],
        inRange: date >= rangeStart && date <= rangeEnd,
        companyCommitCount,
        personalCommitCount,
        companyProjects,
        personalProjects,
        totalCommitCount,
        intensityLevel: intensity(totalCommitCount),
        companyIntensityLevel: intensity(companyCommitCount),
        personalIntensityLevel: intensity(personalCommitCount),
        hasActivity: totalCommitCount > 0,
      });
    }
    weeks.push({ weekStart, days });
    cursor = addDays(cursor, 7);
  }

  const inRangeDays = weeks.flatMap((week) => week.days).filter((day) => day.inRange);
  const active = inRangeDays.filter((day) => day.hasActivity);
  return activityHeatmapPayloadSchema.parse({
    generatedAt: new Date().toISOString(),
    rangeStart,
    rangeEnd,
    summary: {
      activeDays: active.length,
      companyActiveDays: inRangeDays.filter((day) => day.companyCommitCount > 0).length,
      personalActiveDays: inRangeDays.filter((day) => day.personalCommitCount > 0).length,
      totalCompanyCommits: inRangeDays.reduce((sum, day) => sum + day.companyCommitCount, 0),
      totalPersonalCommits: inRangeDays.reduce((sum, day) => sum + day.personalCommitCount, 0),
      totalCommits: inRangeDays.reduce((sum, day) => sum + day.totalCommitCount, 0),
      latestActiveDate: active.at(-1)?.date ?? null,
    },
    weeks,
  });
};

const writePayload = async (payload: ActivityHeatmapPayload) => {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error('Missing SUPABASE_DB_URL');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('begin');
    await client.query('select public.admin_replace_section($1, $2::jsonb)', [
      'activity-heatmap',
      JSON.stringify(payload),
    ]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
};

const main = async () => {
  const repos = await readReposFromGitlog();
  const payload = buildPayload(repos);
  console.log(JSON.stringify({
    mode: isDryRun ? 'dry-run' : 'write',
    scannedRepositories: repos.length,
    rangeStart: payload.rangeStart,
    rangeEnd: payload.rangeEnd,
    summary: payload.summary,
  }, null, 2));
  if (!isDryRun) await writePayload(payload);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
