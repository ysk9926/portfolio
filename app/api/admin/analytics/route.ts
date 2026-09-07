import { assertAnalyticsAdmin } from "@/lib/analytics/server";
import { analyticsResponse, errorResponse } from "@/lib/analytics/ingest";
import { parseAnalyticsFilter } from "@/lib/analytics/filters";
import { getAnalyticsDashboard } from "@/lib/analytics/queries";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const denied = await assertAnalyticsAdmin();
    if (denied) return denied;
    return analyticsResponse(
      200,
      await getAnalyticsDashboard(
        parseAnalyticsFilter(new URL(request.url).searchParams, new Date()),
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
