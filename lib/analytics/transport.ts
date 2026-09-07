import type { EventBatch } from "./types";
const bytes = (batch: EventBatch) =>
  new TextEncoder().encode(JSON.stringify(batch)).byteLength;
export function splitBatches(input: EventBatch): EventBatch[] {
  const batch: EventBatch = {
    sessionId: input.sessionId,
    ingestToken: input.ingestToken,
    pageViewId: input.pageViewId,
    path: input.path,
    pageStartedAt: input.pageStartedAt,
    sequence: input.sequence,
    droppedEvents: input.droppedEvents,
    events: input.events,
  };
  const result: EventBatch[] = [];
  let events: EventBatch["events"] = [];
  for (const event of batch.events) {
    const current = {
      ...batch,
      sequence: batch.sequence + result.length,
      events: [...events, event],
    };
    if (
      events.length &&
      (current.events.length > 50 || bytes(current) > 16384)
    ) {
      result.push({
        ...batch,
        sequence: batch.sequence + result.length,
        events,
      });
      events = [];
    }
    events.push(event);
  }
  if (events.length)
    result.push({ ...batch, sequence: batch.sequence + result.length, events });
  return result.map((b, index) => ({...b, droppedEvents: index === 0 ? batch.droppedEvents : 0})).filter((b) => bytes(b) <= 16384);
}
export function createTransport(
  send: (batch: EventBatch) => Promise<{ status: number; retryAfter?: number }>,
  now: () => number = Date.now,
) {
  const queue: { batch: EventBatch; attempts: number; after: number }[] = [];
  let stopped = false,
    busy = false,
    dropped = 0;
  return {
    enqueue(batch: EventBatch) {
      if (stopped) return;
      for (const part of splitBatches(batch))
        queue.push({ batch: structuredClone(part), attempts: 0, after: 0 });
      while (queue.reduce((n, item) => n + item.batch.events.length, 0) > 200) {
        dropped += queue.shift()!.batch.events.length;
      }
    },
    takeDropped() {
      const value = dropped;
      dropped = 0;
      return value;
    },
    pending() {
      return queue.map((item) => item.batch);
    },
    async flush() {
      if (stopped || busy) return;
      busy = true;
      try {
        while (queue.length && !stopped) {
          const item = queue[0];
          if (item.after > now()) break;
          let result: { status: number; retryAfter?: number };
          try {
            result = await send(item.batch);
          } catch {
            result = { status: 503 };
          }
          if (stopped) break;
          if (result.status === 429) {
            item.after =
              now() + Math.max(1000, (result.retryAfter ?? 60) * 1000);
            break;
          }
          if (
            result.status !== 204 &&
            ![400, 401, 403, 409, 410, 413, 415].includes(result.status)
          ) {
            item.attempts++;
            if (item.attempts <= 3) {
              item.after = now() + Math.pow(2, item.attempts - 1) * 1000;
              break;
            }
          }
          if (result.status !== 204) dropped += item.batch.events.length;
          const index = queue.indexOf(item);
          if (index !== -1) queue.splice(index, 1);
        }
      } finally {
        busy = false;
      }
    },
    stop() {
      stopped = true;
      queue.length = 0;
    },
  };
}
