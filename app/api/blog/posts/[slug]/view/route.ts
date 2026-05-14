import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  const { slug } = await context.params;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('blog_increment_view', {
    p_slug: slug,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, viewCount: data });
}
