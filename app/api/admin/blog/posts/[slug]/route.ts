import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin';
import { blogPostInputSchema } from '@/lib/blog/types';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const assertAdmin = async () => {
  const adminContext = await getAdminContext();
  if (!adminContext.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!adminContext.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const { slug: currentSlug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = blogPostInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: existingError } = await supabase
    .from('blog_posts')
    .select('id, status, published_at')
    .eq('slug', currentSlug)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let publishedAt = existing.published_at;
  if (input.status === 'published') {
    publishedAt = input.publishedAt ?? existing.published_at ?? new Date().toISOString();
  } else {
    publishedAt = null;
  }

  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      thumbnail: input.thumbnail ?? null,
      body: input.body,
      status: input.status,
      published_at: publishedAt,
    })
    .eq('id', existing.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await supabase.from('blog_post_tags').delete().eq('post_id', existing.id);
  if (input.tags.length > 0) {
    const tagRows = Array.from(new Set(input.tags)).map((tag) => ({
      post_id: existing.id,
      tag,
    }));
    const { error: tagError } = await supabase.from('blog_post_tags').insert(tagRows);
    if (tagError) {
      return NextResponse.json({ error: tagError.message }, { status: 500 });
    }
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${currentSlug}`);
  if (currentSlug !== input.slug) revalidatePath(`/blog/${input.slug}`);
  return NextResponse.json({ ok: true, slug: input.slug });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const { slug } = await context.params;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from('blog_posts').delete().eq('slug', slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
}
