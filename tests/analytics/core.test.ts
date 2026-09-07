import assert from "node:assert/strict";
import test from "node:test";
import { batchSchema, sessionInputSchema } from "../../lib/analytics/schema";
import { issueIngestToken, verifyIngestToken } from "../../lib/analytics/auth";
import {
  createMeasurement,
  calculateDepth,
} from "../../lib/analytics/measurement";
const batch = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  ingestToken: "token",
  pageViewId: "22222222-2222-4222-8222-222222222222",
  path: "/",
  pageStartedAt: "2026-09-07T00:00:00.000Z",
  sequence: 0,
  droppedEvents: 0,
  events: [
    {
      type: "exposure_delta",
      atMs: 15000,
      region: { kind: "page" },
      startMs: 0,
      endMs: 15000,
      visibleMs: 15000,
      activeMs: 15000,
    },
  ],
};
test("strict event validation rejects extra personal data and invalid time", () => {
  assert.equal(batchSchema.safeParse(batch).success, true);
  assert.equal(
    batchSchema.safeParse({ ...batch, email: "x@example.test" }).success,
    false,
  );
  assert.equal(
    batchSchema.safeParse({
      ...batch,
      events: [{ ...batch.events[0], activeMs: 16000 }],
    }).success,
    false,
  );
  assert.equal(
    batchSchema.safeParse({ ...batch, path: "/?ref=secret" }).success,
    false,
  );
  assert.equal(
    sessionInputSchema.safeParse({
      requestId: crypto.randomUUID(),
      consent: "denied",
      browserId: null,
      path: "/",
    }).success,
    false,
  );
});
test("ingest token is bound to session and expiration", () => {
  const now = new Date("2026-09-07T00:00:00Z");
  const secret = "test-secret-with-at-least-32-bytes";
  const token = issueIngestToken(
    { id: "session-a", expiresAt: new Date(+now + 86400000), isTest: false },
    secret,
  );
  assert.equal(verifyIngestToken(token, "session-a", now, secret), true);
  assert.equal(verifyIngestToken(token, "session-b", now, secret), false);
  assert.equal(
    verifyIngestToken(token, "session-a", new Date(+now + 86400000), secret),
    false,
  );
  assert.equal(verifyIngestToken(token + "x", "session-a", now, secret), false);
});
test("hidden tabs and idle time do not inflate active time", () => {
  const m = createMeasurement(0);
  m.setVisible(true, 0);
  m.setRegion({ kind: "section", key: "projects" }, 0);
  m.setVisible(false, 20000);
  m.setVisible(true, 80000);
  m.activity(80000);
  const events = m.drain(90000);
  const sum = (kind: string) =>
    events.reduce(
      (n, e) =>
        n +
        (e.type === "exposure_delta" && e.region.kind === kind
          ? e.activeMs
          : 0),
      0,
    );
  assert.equal(sum("page"), 30000);
  assert.equal(sum("section"), 30000);
  assert.deepEqual(m.drain(90000), []);
});
test("modal time belongs only to the project and page totals", () => {
  const m = createMeasurement(0);
  m.setVisible(true, 0);
  m.setRegion({ kind: "section", key: "projects" }, 0);
  m.setRegion({ kind: "project", projectId: 1, surface: "modal" }, 20000);
  const events = m.drain(90000);
  const sum = (kind: string) =>
    events.reduce(
      (n, e) =>
        n +
        (e.type === "exposure_delta" && e.region.kind === kind
          ? e.activeMs
          : 0),
      0,
    );
  assert.equal(sum("page"), 60000);
  assert.equal(sum("section"), 20000);
  assert.equal(sum("project"), 40000);
  assert.equal(calculateDepth(500, 1500, 500), 50);
  assert.equal(calculateDepth(0, 300, 500), 100);
});

test("first visible exposure starts activity even after loading hidden", () => {
  const m = createMeasurement(0);
  m.setVisible(true, 120000);
  const events = m.drain(130000);
  assert.equal(
    events.reduce(
      (n, e) =>
        n +
        (e.type === "exposure_delta" && e.region.kind === "page"
          ? e.activeMs
          : 0),
      0,
    ),
    10000,
  );
});
