import { randomBytes, createHash } from "node:crypto";
import {
  analyticsRepository,
  analyticsSettings,
  assertAnalyticsAdmin,
} from "@/lib/analytics/server";
import {
  analyticsResponse,
  errorResponse,
  readAnalyticsJson,
} from "@/lib/analytics/ingest";
import { linkInputSchema } from "@/lib/analytics/schema";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const denied = await assertAnalyticsAdmin();
    if (denied) return denied;
    const params = new URL(request.url).searchParams;
    return analyticsResponse(
      200,
      await analyticsRepository().listLinks({
        cursor: params.get("cursor") ?? undefined,
      }),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    const denied = await assertAnalyticsAdmin(request);
    if (denied) return denied;
    const input = linkInputSchema.safeParse(await readAnalyticsJson(request));
    if (!input.success) return analyticsResponse(400);
    const token = randomBytes(16).toString("base64url");
    const link = await analyticsRepository().createLink(
      input.data,
      createHash("sha256").update(token).digest("hex"),
      new Date(),
    );
    return analyticsResponse(201, {
      link,
      url: new URL(`/?ref=${token}`, analyticsSettings().origin).toString(),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
