import type { AnalyticsEvent, Region } from "./types";
export function calculateDepth(
  top: number,
  height: number,
  viewport: number,
): number {
  return height <= viewport
    ? 100
    : Math.max(0, Math.min(100, (top / (height - viewport)) * 100));
}
export function chooseRegion(
  candidates: { region: Region; area: number; order: number }[],
  previous: Region | null,
): Region | null {
  const sorted = candidates
    .filter((c) => c.area > 0)
    .sort((a, b) => b.area - a.area || a.order - b.order);
  if (!sorted.length) return null;
  const previousKey = JSON.stringify(previous);
  return (
    sorted.find(
      (c) =>
        c.area === sorted[0].area && JSON.stringify(c.region) === previousKey,
    )?.region ?? sorted[0].region
  );
}
export function createMeasurement(startMs: number) {
  let cursor = startMs,
    lastActivity = startMs,
    visible = false,
    region: Region | null = null;
  let everVisible = false;
  const events: AnalyticsEvent[] = [];
  const lastExposure = new Map<
    string,
    Extract<AnalyticsEvent, { type: "exposure_delta" }>
  >();
  function append(event: Extract<AnalyticsEvent, { type: "exposure_delta" }>) {
    const key = JSON.stringify(event.region);
    const previous = lastExposure.get(key);
    if (
      previous &&
      previous.endMs === event.startMs &&
      event.endMs - previous.startMs <= 60000
    ) {
      previous.endMs = event.endMs;
      previous.atMs = event.atMs;
      previous.visibleMs += event.visibleMs;
      previous.activeMs += event.activeMs;
    } else {
      events.push(event);
      lastExposure.set(key, event);
    }
  }
  function settle(now: number) {
    now = Math.max(cursor, Math.round(now));
    while (cursor < now) {
      const end = Math.min(now, cursor + 60000);
      if (visible) {
        const active = Math.max(
          0,
          Math.min(end, lastActivity + 60000) - cursor,
        );
        const event = {
          type: "exposure_delta" as const,
          atMs: end,
          startMs: cursor,
          endMs: end,
          visibleMs: end - cursor,
          activeMs: active,
        };
        append({ ...event, region: { kind: "page" } });
        if (region && region.kind !== "page") append({ ...event, region });
      }
      cursor = end;
    }
  }
  return {
    setVisible(next: boolean, now: number) {
      settle(now);
      if (next && !everVisible) {
        lastActivity = Math.round(now);
        everVisible = true;
      }
      visible = next;
    },
    activity(now: number) {
      settle(now);
      lastActivity = Math.round(now);
    },
    setRegion(next: Region | null, now: number) {
      settle(now);
      region = next;
    },
    drain(now: number) {
      settle(now);
      lastExposure.clear();
      return events.splice(0);
    },
  };
}
