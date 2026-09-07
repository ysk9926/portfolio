import { handleAnalyticsEvents } from "@/lib/analytics/ingest";
import { analyticsSettings, analyticsRepository } from "@/lib/analytics/server";
import { verifyIngestToken } from "@/lib/analytics/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = analyticsSettings();
  return handleAnalyticsEvents(request, {
    enabled: config.enabled,
    allowedOrigin: config.origin,
    now: () => new Date(),
    verifyToken: (token, id, now) =>
      verifyIngestToken(token, id, now, config.secret),
    isSessionActive: (id, now) =>
      analyticsRepository().sessionIsActive(id, now),
    takeRateLimit: (key, limit, now) =>
      analyticsRepository().takeRateLimit(key, limit, now),
    insertBatch: (batch, now) => analyticsRepository().insertBatch(batch, now),
  });
}
