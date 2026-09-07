import { z } from "zod";
import {
  analyticsRepository,
  assertAnalyticsAdmin,
} from "@/lib/analytics/server";
import { analyticsResponse, errorResponse } from "@/lib/analytics/ingest";
import { getSessionDetail } from "@/lib/analytics/queries";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const denied = await assertAnalyticsAdmin();
    if (denied) return denied;
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return analyticsResponse(400);
    const data = await getSessionDetail(id);
    return data ? analyticsResponse(200, data) : analyticsResponse(404);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const denied = await assertAnalyticsAdmin(request);
    if (denied) return denied;
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return analyticsResponse(400);
    return analyticsResponse(
      (await analyticsRepository().deleteSession(id, new Date())) ? 204 : 404,
    );
  } catch (e) {
    return errorResponse(e);
  }
}
