import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

type Status = 'draft' | 'published';

interface PostMeta {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: Status;
  thumbnail: string | null;
}

const parseFrontmatter = (raw: string): { meta: PostMeta; body: string } => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter (--- ... ---) at top of file');

  const yaml = match[1];
  const body = match[2].replace(/^\n+/, '');

  const get = (key: string): string | undefined => {
    const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
    const m = yaml.match(re);
    return m ? m[1].trim() : undefined;
  };

  const stripQuotes = (s: string) => s.replace(/^['"]|['"]$/g, '');

  const slug = get('slug');
  const title = get('title');
  const summary = get('summary');
  const statusRaw = get('status') ?? 'draft';
  const thumbnail = get('thumbnail');
  const tagsRaw = get('tags');

  if (!slug || !title || !summary) {
    throw new Error('frontmatter requires slug, title, summary');
  }

  const status = stripQuotes(statusRaw) as Status;
  if (status !== 'draft' && status !== 'published') {
    throw new Error(`status must be 'draft' or 'published', got ${status}`);
  }

  const tags: string[] = tagsRaw
    ? tagsRaw
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((t) => stripQuotes(t.trim()))
        .filter(Boolean)
    : [];

  return {
    meta: {
      slug: stripQuotes(slug),
      title: stripQuotes(title),
      summary: stripQuotes(summary),
      status,
      thumbnail: thumbnail ? stripQuotes(thumbnail) : null,
      tags,
    },
    body,
  };
};

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: tsx scripts/post-blog.ts <path-to-markdown-file>');
    process.exit(1);
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error('SUPABASE_DB_URL is not set');

  const abs = path.resolve(process.cwd(), file);
  const raw = await fs.readFile(abs, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  if (!body.trim()) throw new Error('body is empty');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query('begin');

    const publishedAt =
      meta.status === 'published' ? new Date().toISOString() : null;

    const { rows } = await client.query<{ id: number; slug: string }>(
      `insert into public.blog_posts
        (slug, title, summary, thumbnail, body, status, published_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (slug) do update set
         title = excluded.title,
         summary = excluded.summary,
         thumbnail = excluded.thumbnail,
         body = excluded.body,
         status = excluded.status,
         published_at = coalesce(public.blog_posts.published_at, excluded.published_at),
         updated_at = now()
       returning id, slug`,
      [
        meta.slug,
        meta.title,
        meta.summary,
        meta.thumbnail,
        body,
        meta.status,
        publishedAt,
      ],
    );

    const post = rows[0];
    if (!post) throw new Error('insert/update returned no row');

    await client.query('delete from public.blog_post_tags where post_id = $1', [
      post.id,
    ]);

    if (meta.tags.length > 0) {
      const unique = Array.from(new Set(meta.tags));
      const values: string[] = [];
      const params: unknown[] = [];
      unique.forEach((tag, i) => {
        values.push(`($1, $${i + 2})`);
        params.push(tag);
      });
      await client.query(
        `insert into public.blog_post_tags (post_id, tag) values ${values.join(', ')}`,
        [post.id, ...params],
      );
    }

    await client.query('commit');
    console.log(
      `✅ upserted: id=${post.id} slug=${post.slug} status=${meta.status}`,
    );
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
