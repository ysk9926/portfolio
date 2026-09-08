export const LIMITS = {
  bodyBytes: 16384,
  batchEvents: 50,
  queuedEvents: 200,
  flushMs: 15000,
  idleMs: 60000,
  sessionIdleMs: 1800000,
  sessionTtlMs: 86400000,
  retentionDays: 90,
} as const;
export const SECTION_KEYS = [
  "hero",
  "ai-workflow",
  "about",
  "skills",
  "archiving",
  "activity",
  "projects",
  "career",
] as const;
export const TARGET_KEYS = [
  "ai-workflow",
  "github",
  "blog",
  "email",
  "resume",
  "demo",
  "archive",
] as const;
