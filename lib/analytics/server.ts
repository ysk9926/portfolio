import { createHmac } from "node:crypto";
import { getAdminContext } from "@/lib/admin";
import { getAnalyticsPool } from "./db";
import { createAnalyticsRepository } from "./repository";
import { analyticsResponse } from "./ingest";
export const analyticsRepository = () =>
  createAnalyticsRepository(getAnalyticsPool());
export function analyticsSettings() {
  const production =
    process.env.VERCEL_ENV === "production" ||
    process.env.APP_ENV === "production";
  const qa = !production && process.env.ANALYTICS_QA_MODE === "true";
  const secret = process.env.ANALYTICS_SIGNING_SECRET ?? "";
  const rateSecret = process.env.ANALYTICS_RATE_LIMIT_SECRET ?? "";
  let origin = "";
  try {
    origin = new URL(
      process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "",
    ).origin;
  } catch {}
  const enabled =
    process.env.ANALYTICS_ENABLED === "true" &&
    (production || qa) &&
    secret.length >= 32 &&
    rateSecret.length >= 32 &&
    !!process.env.SUPABASE_DB_URL &&
    !!origin;
  return { enabled, qa, secret, rateSecret, origin };
}
export async function assertAnalyticsAdmin(request?: Request) {
  const admin = await getAdminContext();
  if (!admin.user) return analyticsResponse(401);
  if (!admin.isAdmin) return analyticsResponse(403);
  if (request && request.headers.get("origin") !== analyticsSettings().origin)
    return analyticsResponse(403);
  return null;
}
export function rateLimitKey(request: Request, secret: string): string {
  // Vercel overwrites x-vercel-forwarded-for at its ingress. Do not trust arbitrary X-Forwarded-For.
  const ip =
    process.env.VERCEL === "1"
      ? (request.headers.get("x-vercel-forwarded-for") ?? "unknown")
      : "local";
  return (
    "session:" +
    createHmac("sha256", secret)
      .update(`${new Date().toISOString().slice(0, 10)}:${ip}`)
      .digest("hex")
  );
}
