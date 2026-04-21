import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin';
import { getSectionPayload, getSectionUpdatedAt } from '@/lib/portfolio-data/server';
import {
  isSectionKey,
  sectionPayloadSchemaMap,
} from '@/lib/types/payload';
import { createServerSupabaseClient } from '@/utils/supabase/server';

const buildSectionKey = async (
  params: Promise<{ sectionKey: string }> | { sectionKey: string },
) => {
  const resolved = await params;
  return resolved.sectionKey;
};

const assertAdmin = async () => {
  const adminContext = await getAdminContext();

  if (!adminContext.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminContext.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ sectionKey: string }> | { sectionKey: string } },
) {
  try {
    const unauthorizedResponse = await assertAdmin();
    if (unauthorizedResponse) return unauthorizedResponse;

    const sectionKey = await buildSectionKey(context.params);
    if (!isSectionKey(sectionKey)) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    const [payload, updatedAt] = await Promise.all([
      getSectionPayload(sectionKey),
      getSectionUpdatedAt(sectionKey),
    ]);

    return NextResponse.json({
      sectionKey,
      payload,
      updatedAt,
    });
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ sectionKey: string }> | { sectionKey: string } },
) {
  try {
    const unauthorizedResponse = await assertAdmin();
    if (unauthorizedResponse) return unauthorizedResponse;

    const sectionKey = await buildSectionKey(context.params);
    if (!isSectionKey(sectionKey)) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    const body = (await request.json()) as { payload?: unknown };
    const schema = sectionPayloadSchemaMap[sectionKey];
    const parsedPayload = schema.safeParse(body.payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsedPayload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc('admin_replace_section', {
      p_section_key: sectionKey,
      p_payload: parsedPayload.data,
    });

    if (error) {
      return NextResponse.json(
        { error: `Failed to persist section: ${error.message}` },
        { status: 500 },
      );
    }

    revalidatePath('/');
    revalidatePath('/admin');

    return NextResponse.json({
      ok: true,
      updatedAt: typeof data === 'string' ? data : null,
    });
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
