import assert from "node:assert/strict";
import test from "node:test";
import {
  handleAnalyticsEvents,
  type IngestDeps,
} from "../../lib/analytics/ingest";
const sessionId = "11111111-1111-4111-8111-111111111111";
const payload = {
  sessionId,
  ingestToken: "invalid",
  pageViewId: "22222222-2222-4222-8222-222222222222",
  path: "/",
  pageStartedAt: "2026-09-07T00:00:00.000Z",
  sequence: 0,
  droppedEvents: 0,
  events: [{ type: "page_start", atMs: 0 }],
};
const req = (body: unknown = payload, origin = "https://portfolio.example") =>
  new Request(origin + "/api/analytics/events", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
function deps(): IngestDeps {
  return {
    enabled: true,
    allowedOrigin: "https://portfolio.example",
    now: () => new Date("2026-09-07T00:00:01Z"),
    verifyToken: () => true,
    isSessionActive: async () => true,
    takeRateLimit: async () => true,
    insertBatch: async () => "inserted",
  };
}
test("bad signature and foreign origin reject before persistence", async () => {
  let writes = 0;
  const d = {
    ...deps(),
    verifyToken: () => false,
    insertBatch: async () => {
      writes++;
      return "inserted" as const;
    },
  };
  assert.equal((await handleAnalyticsEvents(req(), d)).status, 401);
  assert.equal(writes, 0);
  assert.equal(
    (await handleAnalyticsEvents(req(payload, "https://evil.example"), deps()))
      .status,
    403,
  );
});
test("oversized streamed body and invalid schema rejected", async () => {
  assert.equal(
    (await handleAnalyticsEvents(req({ padding: "x".repeat(17000) }), deps()))
      .status,
    413,
  );
  assert.equal(
    (await handleAnalyticsEvents(req({ ...payload, email: "x" }), deps()))
      .status,
    400,
  );
});
test("rate limit and inactive sessions return actionable status", async () => {
  const r = await handleAnalyticsEvents(req(), {
    ...deps(),
    takeRateLimit: async () => false,
  });
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("retry-after"), "60");
  assert.equal(
    (
      await handleAnalyticsEvents(req(), {
        ...deps(),
        isSessionActive: async () => false,
      })
    ).status,
    410,
  );
});
test("collection switch stops writes without breaking page", async () => {
  let writes = 0;
  assert.equal(
    (
      await handleAnalyticsEvents(req(), {
        ...deps(),
        enabled: false,
        insertBatch: async () => {
          writes++;
          return "inserted";
        },
      })
    ).status,
    204,
  );
  assert.equal(writes, 0);
  assert.equal((await handleAnalyticsEvents(req(), deps())).status, 204);
});
