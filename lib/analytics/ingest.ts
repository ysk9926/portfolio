import { batchSchema } from "./schema";
import type { EventBatch } from "./types";
export interface IngestDeps {
  enabled: boolean;
  allowedOrigin: string;
  now(): Date;
  verifyToken(token: string, sessionId: string, now: Date): boolean;
  isSessionActive(id: string, now: Date): Promise<boolean>;
  takeRateLimit(key: string, limit: number, now: Date): Promise<boolean>;
  insertBatch(batch: EventBatch, now: Date): Promise<"inserted" | "duplicate">;
}
export const analyticsResponse = (
  status: number,
  data?: unknown,
  headers?: HeadersInit,
) =>
  new Response(data === undefined ? null : JSON.stringify(data), {
    status,
    headers: {
      "cache-control": "private, no-store",
      ...(data === undefined ? {} : { "content-type": "application/json" }),
      ...headers,
    },
  });
export async function readAnalyticsJson(request: Request): Promise<unknown> {
  if (
    !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    throw Object.assign(new Error("Unsupported content type"), { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error("Missing body"), { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw Object.assign(new Error("Body too large"), { status: 413 });
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { status: 400 });
  }
}
export function errorResponse(error: unknown): Response {
  const status =
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 503;
  return analyticsResponse(status, {
    error:
      status >= 500
        ? "일시적으로 저장할 수 없습니다."
        : "요청을 처리할 수 없습니다.",
  });
}
export async function handleAnalyticsEvents(
  request: Request,
  deps: IngestDeps,
): Promise<Response> {
  if (!deps.enabled) return analyticsResponse(204);
  if (request.headers.get("origin") !== deps.allowedOrigin)
    return analyticsResponse(403);
  try {
    const result = batchSchema.safeParse(await readAnalyticsJson(request));
    if (!result.success) return analyticsResponse(400);
    const batch = result.data;
    const now = deps.now();
    if (!deps.verifyToken(batch.ingestToken, batch.sessionId, now))
      return analyticsResponse(401);
    if (!(await deps.isSessionActive(batch.sessionId, now)))
      return analyticsResponse(410);
    if (!(await deps.takeRateLimit(`events:${batch.sessionId}`, 10, now)))
      return analyticsResponse(429, undefined, { "retry-after": "60" });
    await deps.insertBatch(batch, now);
    return analyticsResponse(204);
  } catch (error) {
    return errorResponse(error);
  }
}
