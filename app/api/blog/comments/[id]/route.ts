import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { commentDeleteSchema, commentUpdateSchema } from '@/lib/blog/types';
import { verifyPassword } from '@/lib/blog/password';
import { getAdminContext } from '@/lib/admin';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const resolveId = async (
  params: Promise<{ id: string }> | { id: string },
): Promise<number | null> => {
  const resolved = await params;
  const id = Number.parseInt(resolved.id, 10);
  return Number.isFinite(id) ? id : null;
};

const fetchComment = async (commentId: number) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_comments')
    .select('id, password_hash, is_deleted, post_id, blog_posts(slug)')
    .eq('id', commentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as
    | {
        id: number;
        password_hash: string;
        is_deleted: boolean;
        post_id: number;
        blog_posts: { slug: string } | { slug: string }[] | null;
      }
    | null;
};

const resolveSlug = (
  row: NonNullable<Awaited<ReturnType<typeof fetchComment>>>,
): string | null => {
  if (!row.blog_posts) return null;
  if (Array.isArray(row.blog_posts)) return row.blog_posts[0]?.slug ?? null;
  return row.blog_posts.slug ?? null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const id = await resolveId(context.params);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const parsed = commentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '입력이 유효하지 않습니다.' }, { status: 400 });
  }

  const row = await fetchComment(id);
  if (!row || row.is_deleted) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!verifyPassword(parsed.data.password, row.password_hash)) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('blog_update_comment', {
    p_comment_id: id,
    p_password_hash: row.password_hash,
    p_body: parsed.data.body,
  });

  if (error) {
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 500 });
  }

  const slug = resolveSlug(row);
  if (slug) revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const id = await resolveId(context.params);
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = commentDeleteSchema.safeParse(body);
  const password = parsed.success ? parsed.data.password : undefined;

  const row = await fetchComment(id);
  if (!row || row.is_deleted) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const adminContext = await getAdminContext();
  const isAdmin = adminContext.isAdmin;

  if (!isAdmin) {
    if (!password || !verifyPassword(password, row.password_hash)) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
    }
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('blog_delete_comment', {
    p_comment_id: id,
    p_password_hash: row.password_hash,
  });

  if (error) {
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }

  const slug = resolveSlug(row);
  if (slug) revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
}
