import { NextResponse } from 'next/server';
import { likeToggleSchema } from '@/lib/blog/types';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id: rawId } = await context.params;
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const parsed = likeToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('blog_toggle_comment_like', {
    p_comment_id: id,
    p_delta: parsed.data.delta,
  });

  if (error) {
    return NextResponse.json({ error: '좋아요 처리에 실패했습니다.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, likeCount: data });
}
