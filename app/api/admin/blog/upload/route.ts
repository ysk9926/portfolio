import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const BUCKET = 'blog-images';
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  const adminContext = await getAdminContext();
  if (!adminContext.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!adminContext.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '파일이 너무 큽니다 (최대 8MB).' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: '허용되지 않는 형식입니다.' }, { status: 400 });
  }

  const extension = file.name.split('.').pop() ?? 'bin';
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  const path = `posts/${stamp}-${random}.${extension}`;

  const supabase = await createServerSupabaseClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: publicData.publicUrl, path });
}
