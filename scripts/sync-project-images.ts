import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_IMAGE_ORIGIN } from '../lib/projects/images';

const root = fileURLToPath(new URL('../public/images/projects/', import.meta.url));
const bucket = new URL(PROJECT_IMAGE_ORIGIN).hostname.split('.')[0];
const profile = 'tmdrb';
const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'svg'];
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--dry-run')) throw new Error('Only --dry-run is supported.');
const dryRun = args.includes('--dry-run');

const aws = (args: string[]) => execFileSync('aws', [
  ...args, '--profile', profile, '--region', 'ap-northeast-2', '--no-cli-pager',
], { encoding: 'utf8' });

// Verify the account before writing, in case the local profile is reconfigured.
const identity = JSON.parse(aws(['sts', 'get-caller-identity', '--output', 'json']));
if (identity.Account !== '167217328107') throw new Error('Unexpected AWS account for tmdrb.');

console.log(aws([
  's3', 'sync', root, `s3://${bucket}/images/projects/`,
  '--exclude', '*', ...extensions.flatMap((ext) => ['--include', `*.${ext}`]),
  '--cache-control', 'public,max-age=3600', '--no-progress',
  ...(dryRun ? ['--dryrun'] : []),
]));

if (!dryRun) {
  const listing = JSON.parse(aws([
    's3api', 'list-objects-v2', '--bucket', bucket, '--prefix', 'images/projects/', '--output', 'json',
  ])) as { Contents?: { Key: string; Size: number; ETag: string }[] };
  const remote = new Map(listing.Contents?.map((item) => [item.Key, item]));
  let count = 0;
  let bytes = 0;
  const verify = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { verify(file); continue; }
      if (!entry.isFile() || !extensions.includes(path.extname(entry.name).slice(1))) continue;
      const key = `images/projects/${path.relative(root, file).split(path.sep).join('/')}`;
      const local = readFileSync(file);
      const stored = remote.get(key);
      // Single-part SSE-S3 uploads expose the content MD5 as the ETag.
      const md5 = createHash('md5').update(local).digest('hex');
      if (!stored || stored.Size !== local.length || stored.ETag !== `"${md5}"`) {
        throw new Error(`Verification failed: ${key}. Compare the object content before continuing.`);
      }
      count += 1;
      bytes += local.length;
    }
  };
  verify(root);
  console.log(`Verified ${count} images (${bytes} bytes): local size and MD5 match S3.`);
}
