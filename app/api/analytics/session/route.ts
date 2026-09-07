import { getAdminContext } from "@/lib/admin";
import { sessionInputSchema } from "@/lib/analytics/schema";
import {
  analyticsSettings,
  analyticsRepository,
  rateLimitKey,
} from "@/lib/analytics/server";
import { issueIngestToken } from "@/lib/analytics/auth";
import {
  analyticsResponse,
  errorResponse,
  readAnalyticsJson,
} from "@/lib/analytics/ingest";
import type { DeviceType } from "@/lib/analytics/types";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = analyticsSettings();
  if (!config.enabled) return analyticsResponse(403);
  if (request.headers.get("origin") !== config.origin)
    return analyticsResponse(403);
  try {
    if ((await getAdminContext()).isAdmin && !config.qa)
      return analyticsResponse(403);
    const input = sessionInputSchema.safeParse(
      await readAnalyticsJson(request),
    );
    if (!input.success) return analyticsResponse(400);
    const repo = analyticsRepository();
    const now = new Date();
    if (
      !(await repo.takeRateLimit(
        rateLimitKey(request, config.rateSecret),
        30,
        now,
      ))
    )
      return analyticsResponse(429, undefined, { "retry-after": "60" });
    const ua = (request.headers.get("user-agent") ?? "").slice(0, 1024);
    const device: DeviceType = /ipad|tablet/i.test(ua)
      ? "tablet"
      : /mobile|android/i.test(ua)
        ? "mobile"
        : ua
          ? "desktop"
          : "unknown";
    const browserFamily = /edg\//i.test(ua)
      ? "Edge"
      : /firefox/i.test(ua)
        ? "Firefox"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /safari/i.test(ua)
            ? "Safari"
            : "unknown";
    const session = await repo.createSession(
      input.data,
      {
        device,
        browserFamily,
        suspectedBot: /bot|crawler|spider|headless|preview|scanner/i.test(ua),
        isTest: config.qa,
      },
      now,
    );
    return analyticsResponse(201, {
      sessionId: session.id,
      ingestToken: issueIngestToken(session, config.secret),
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
