import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { commentCreateSchema } from '@/lib/blog/types';
import { hashIp, hashPassword, verifyPassword } from '@/lib/blog/password';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const requestSchema = commentCreateSchema.extend({
  slug: z.string().min(1),
});

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: `${issue?.path?.join('.') ?? '입력'}: ${issue?.message ?? '유효하지 않음'}` },
      { status: 400 },
    );
  }

  const { slug, parentId, nickname, password, body: text } = parsed.data;
  const ipHash = hashIp(getClientIp(request));
  const passwordHash = hashPassword(password);

  // Quick verify so we know the hash actually round-trips before storing.
  if (!verifyPassword(password, passwordHash)) {
    return NextResponse.json({ error: '비밀번호 처리 오류' }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('blog_create_comment', {
    p_slug: slug,
    p_parent_id: parentId ?? null,
    p_nickname: nickname,
    p_password_hash: passwordHash,
    p_body: text,
    p_ip_hash: ipHash,
  });

  if (error) {
    const message = mapRpcError(error.message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ ok: true, comment: data });
}

const mapRpcError = (message: string): string => {
  if (message.includes('rate_limited')) return '잠시 후 다시 시도해주세요.';
  if (message.includes('post_not_found')) return '게시글을 찾을 수 없습니다.';
  if (message.includes('parent_not_found')) return '대댓글 대상 댓글을 찾을 수 없습니다.';
  if (message.includes('max_depth_exceeded')) return '대댓글은 한 단계까지만 작성할 수 있습니다.';
  if (message.includes('invalid_nickname')) return '닉네임을 확인해주세요.';
  if (message.includes('invalid_body')) return '내용을 확인해주세요.';
  return '댓글을 저장하지 못했습니다.';
};
