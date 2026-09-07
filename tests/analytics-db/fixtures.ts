import type { EventBatch, SessionInput } from '../../lib/analytics/types';

export const makeSessionInput = (overrides: Partial<SessionInput> = {}): SessionInput => ({
  requestId: crypto.randomUUID(),
  consent: 'granted',
  browserId: null,
  path: '/',
  ...overrides,
});

export const makeBatch = (sessionId: string, overrides: Partial<EventBatch> = {}): EventBatch => ({
  sessionId,
  ingestToken: 'not-persisted',
  pageViewId: crypto.randomUUID(),
  path: '/',
  pageStartedAt: '2026-09-07T00:00:00.000Z',
  sequence: 0,
  droppedEvents: 0,
  events: [{
    type: 'exposure_delta',
    atMs: 15_000,
    region: { kind: 'page' },
    startMs: 0,
    endMs: 15_000,
    visibleMs: 15_000,
    activeMs: 15_000,
  }],
  ...overrides,
});
