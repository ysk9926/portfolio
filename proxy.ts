import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const getCanonicalOrigin = (): string | null => {
  const rawUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
};

const canonicalOrigin = getCanonicalOrigin();

export async function proxy(request: NextRequest) {
  if (canonicalOrigin) {
    const canonicalUrl = new URL(canonicalOrigin);
    const isVercelDefaultHost = request.nextUrl.hostname.endsWith('.vercel.app');
    const isDifferentHost = request.nextUrl.hostname !== canonicalUrl.hostname;

    if (isVercelDefaultHost && isDifferentHost) {
      const redirectUrl = new URL(request.nextUrl.pathname, canonicalOrigin);
      redirectUrl.search = request.nextUrl.search;
      return NextResponse.redirect(redirectUrl, 308);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
