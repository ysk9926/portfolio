import { z } from "zod";
import {
  analyticsRepository,
  assertAnalyticsAdmin,
} from "@/lib/analytics/server";
import {
  analyticsResponse,
  errorResponse,
  readAnalyticsJson,
} from "@/lib/analytics/ingest";
import { linkPatchSchema } from "@/lib/analytics/schema";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    const denied = await assertAnalyticsAdmin(request);
    if (denied) return denied;
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return analyticsResponse(400);
    const input = linkPatchSchema.safeParse(await readAnalyticsJson(request));
    if (!input.success) return analyticsResponse(400);
    const link = await analyticsRepository().updateLink(
      id,
      input.data,
      new Date(),
    );
    return link ? analyticsResponse(200, { link }) : analyticsResponse(404);
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
      (await analyticsRepository().deleteLink(id)) ? 204 : 404,
    );
  } catch (e) {
    return errorResponse(e);
  }
}
