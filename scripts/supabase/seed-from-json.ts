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

const requiredEnv = ['SUPABASE_DB_URL'] as const;
for (const envKey of requiredEnv) {
  if (!process.env[envKey]) {
    throw new Error(`Missing env: ${envKey}`);
  }
}

const dbUrl = process.env.SUPABASE_DB_URL as string;
const adminEmail = process.env.SUPABASE_ADMIN_EMAIL;

const run = async () => {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query('begin');

    if (adminEmail) {
      const adminUserQuery = await client.query<{
        id: string;
      }>(
        'select id from auth.users where email = $1 limit 1',
        [adminEmail],
      );

      if (!adminUserQuery.rows.length) {
        throw new Error(
          `Cannot find auth.users row for SUPABASE_ADMIN_EMAIL=${adminEmail}`,
        );
      }

      const adminUserId = adminUserQuery.rows[0].id;
      await client.query(
        `
          insert into public.admin_users (user_id, email)
          values ($1, $2)
          on conflict (user_id)
          do update set email = excluded.email
        `,
        [adminUserId, adminEmail],
      );
      console.log(`Upserted admin_users row: ${adminEmail} (${adminUserId})`);
    }

    for (const sectionKey of sectionOrder) {
      const filePath = path.join(process.cwd(), 'data', sectionFileMap[sectionKey]);
      const fileRaw = await fs.readFile(filePath, 'utf8');
      const payload = JSON.parse(fileRaw);

      const result = await client.query<{
        updated_at: string;
      }>(
        `
          select public.admin_replace_section($1, $2::jsonb) as updated_at
        `,
        [sectionKey, JSON.stringify(payload)],
      );

      const updatedAt = result.rows[0]?.updated_at ?? 'unknown';
      console.log(`Seeded section: ${sectionKey} (updatedAt=${updatedAt})`);
    }

    await client.query('commit');
    console.log('Seed complete');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
};

void run();
