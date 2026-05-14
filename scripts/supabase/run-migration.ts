import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  throw new Error('Missing env: SUPABASE_DB_URL');
}

const target = process.argv[2];
if (!target) {
  throw new Error('Usage: tsx scripts/supabase/run-migration.ts <migration-file>');
}

const run = async () => {
  const filePath = path.isAbsolute(target)
    ? target
    : path.resolve(process.cwd(), target);
  const sql = await fs.readFile(filePath, 'utf8');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log(`▶ Applying migration: ${path.basename(filePath)}`);
    await client.query(sql);
    console.log('✓ Migration applied successfully');
  } finally {
    await client.end();
  }
};

run().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  process.exit(1);
});
