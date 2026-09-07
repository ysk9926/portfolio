import { z } from "zod";
import { LIMITS, SECTION_KEYS, TARGET_KEYS } from "./constants";
const ms = z.number().int().min(0).max(LIMITS.sessionTtlMs);
const projectId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const surface = z.enum(["modal", "detail"]);
export const regionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("page") }).strict(),
  z.object({ kind: z.literal("section"), key: z.enum(SECTION_KEYS) }).strict(),
  z.object({ kind: z.literal("project"), projectId, surface }).strict(),
]);
export const pathSchema = z
  .string()
  .max(512)
  .regex(
    /^\/(?:projects\/[A-Za-z0-9_%~-]+|blog(?:\/(?:tags\/)?[A-Za-z0-9_%~-]+)?)?$/,
  )
  .refine((p) => {
    try {
      return (
        !/[?#\\\u0000-\u001f]/.test(decodeURIComponent(p)) &&
        !decodeURIComponent(p).includes("..")
      );
    } catch {
      return false;
    }
  }, "Invalid path");
export const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("page_start"), atMs: ms }).strict(),
  z
    .object({
      type: z.literal("exposure_delta"),
      atMs: ms,
      region: regionSchema,
      startMs: ms,
      endMs: ms,
      visibleMs: ms,
      activeMs: ms,
    })
    .strict()
    .refine(
      (e) =>
        e.startMs <= e.endMs &&
        e.endMs - e.startMs <= 60000 &&
        e.activeMs <= e.visibleMs &&
        e.visibleMs <= e.endMs - e.startMs &&
        e.atMs === e.endMs,
      "Invalid exposure interval",
    ),
  z
    .object({ type: z.literal("region_enter"), atMs: ms, region: regionSchema })
    .strict(),
  z
    .object({
      type: z.literal("scroll_state"),
      atMs: ms,
      region: regionSchema,
      depth: z.number().min(0).max(100),
      milestones: z
        .array(
          z.union([
            z.literal(25),
            z.literal(50),
            z.literal(75),
            z.literal(90),
            z.literal(100),
          ]),
        )
        .max(5),
      shortPage: z.boolean(),
    })
    .strict()
    .refine(
      (e) =>
        e.region.kind !== "section" &&
        new Set(e.milestones).size === e.milestones.length &&
        e.milestones.every((v) => v <= e.depth),
      "Invalid scroll state",
    ),
  z
    .object({
      type: z.literal("interaction"),
      atMs: ms,
      action: z.enum(["scroll", "click", "key", "pointer", "touch"]),
    })
    .strict(),
  z
    .object({ type: z.literal("project_open"), atMs: ms, projectId, surface })
    .strict(),
  z
    .object({ type: z.literal("project_close"), atMs: ms, projectId, surface })
    .strict(),
  z
    .object({
      type: z.literal("outbound_click"),
      atMs: ms,
      target: z.enum(TARGET_KEYS),
      projectId: projectId.optional(),
    })
    .strict(),
]);
export const batchSchema = z
  .object({
    sessionId: z.uuid(),
    ingestToken: z.string().min(1).max(512),
    pageViewId: z.uuid(),
    path: pathSchema,
    pageStartedAt: z.iso.datetime(),
    sequence: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    droppedEvents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    events: z.array(eventSchema).min(1).max(LIMITS.batchEvents),
  })
  .strict();
export const sessionInputSchema = z
  .object({
    requestId: z.uuid(),
    consent: z.literal("granted"),
    browserId: z.uuid().nullable(),
    ref: z
      .string()
      .regex(/^[\w-]{22,64}$/)
      .optional(),
    path: pathSchema,
    sourceOrigin: z
      .url()
      .max(255)
      .transform((v) => new URL(v).origin)
      .refine((v) => /^https?:\/\//.test(v))
      .optional(),
    utm: z
      .object({
        source: z.string().max(100).optional(),
        medium: z.string().max(100).optional(),
        campaign: z.string().max(100).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export const linkInputSchema = z
  .object({
    companyLabel: z.string().trim().min(1).max(100),
    position: z.string().trim().max(200).default(""),
    submittedAt: z.iso.date().nullable().default(null),
    note: z.string().trim().max(1000).default(""),
  })
  .strict();
export const linkPatchSchema = linkInputSchema
  .partial()
  .extend({ disabled: z.boolean().optional() })
  .strict();
