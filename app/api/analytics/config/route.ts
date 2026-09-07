import { getAdminContext } from "@/lib/admin";
import { analyticsSettings } from "@/lib/analytics/server";
import { analyticsResponse } from "@/lib/analytics/ingest";
export const runtime = "nodejs";
export async function GET() {
  const settings = analyticsSettings();
  try {
    const admin = await getAdminContext();
    const excluded = admin.isAdmin && !settings.qa;
    return analyticsResponse(200, {
      enabled: settings.enabled && !excluded,
      excluded,
      consentVersion: 1,
      retentionDays: 90,
      gaId:
        settings.enabled && !excluded
          ? process.env.ANALYTICS_GA_MANUAL_PAGEVIEWS === "true"
            ? (process.env.GA_MEASUREMENT_ID ?? null)
            : null
          : null,
    });
  } catch {
    return analyticsResponse(200, {
      enabled: false,
      excluded: true,
      consentVersion: 1,
      retentionDays: 90,
      gaId: null,
    });
  }
}
