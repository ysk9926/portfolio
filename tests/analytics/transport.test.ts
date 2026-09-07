import assert from "node:assert/strict";
import test from "node:test";
import { createTransport, splitBatches } from "../../lib/analytics/transport";
import type { EventBatch } from "../../lib/analytics/types";
const batch: EventBatch = {
  sessionId: crypto.randomUUID(),
  ingestToken: "token",
  pageViewId: crypto.randomUUID(),
  path: "/",
  pageStartedAt: new Date().toISOString(),
  sequence: 0,
  droppedEvents: 0,
  events: [{ type: "page_start", atMs: 0 }],
};
test("retry keeps exact payload; successful retry dequeues", async () => {
  const sent: string[] = [];
  let now = 0;
  const t = createTransport(
    async (b) => {
      sent.push(JSON.stringify(b));
      return { status: sent.length === 1 ? 503 : 204 };
    },
    () => now,
  );
  t.enqueue(batch);
  await t.flush();
  now = 2000;
  await t.flush();
  await t.flush();
  assert.equal(sent.length, 2);
  assert.equal(sent[0], sent[1]);
  t.stop();
});
test("revoking prevents further queue sends", async () => {
  let count = 0;
  const t = createTransport(async () => {
    count++;
    return { status: 204 };
  });
  t.enqueue(batch);
  t.stop();
  await t.flush();
  assert.equal(count, 0);
});
test("batch splitter limits both count and UTF8 payload", () => {
  const batches = splitBatches({
    ...batch,
    events: Array.from({ length: 120 }, () => ({
      type: "page_start",
      atMs: 0,
    })),
  });
  assert.equal(batches.length, 3);
  assert.deepEqual(
    batches.map((b) => b.sequence),
    [0, 1, 2],
  );
  assert.ok(
    batches.every(
      (b) =>
        b.events.length <= 50 && Buffer.byteLength(JSON.stringify(b)) <= 16384,
    ),
  );
});

test("transport serializes only the event envelope, not session credential metadata", async () => {
  const { batchSchema } = await import("../../lib/analytics/schema");
  const credentialsWithMetadata = {
    ...batch,
    expiresAt: new Date().toISOString(),
  };
  assert.equal(
    batchSchema.safeParse(splitBatches(credentialsWithMetadata)[0]).success,
    true,
  );
});

test("gateway failures are retried rather than acknowledged", async () => {
  let now = 0;
  let attempts = 0;
  const transport = createTransport(
    async () => ({ status: ++attempts === 1 ? 502 : 204 }),
    () => now,
  );
  transport.enqueue(batch);
  await transport.flush();
  assert.equal(transport.pending().length, 1);
  now = 2000;
  await transport.flush();
  assert.equal(attempts, 2);
  assert.equal(transport.pending().length, 0);
});

test('splitting a large batch counts dropped events only once',()=>{
 const result=splitBatches({...batch,droppedEvents:7,events:Array.from({length:120},()=>({type:'page_start' as const,atMs:0}))});
 assert.equal(result.reduce((n,b)=>n+b.droppedEvents,0),7);
});
