export type SectionKey =
  | "hero"
  | "about"
  | "skills"
  | "archiving"
  | "activity"
  | "projects"
  | "career";
export type Region =
  | { kind: "page" }
  | { kind: "section"; key: SectionKey }
  | { kind: "project"; projectId: number; surface: "modal" | "detail" };
export type TargetKey =
  "github" | "blog" | "email" | "resume" | "demo" | "archive";
export type AnalyticsEvent = { atMs: number } & (
  | { type: "page_start" }
  | {
      type: "exposure_delta";
      region: Region;
      startMs: number;
      endMs: number;
      visibleMs: number;
      activeMs: number;
    }
  | { type: "region_enter"; region: Region }
  | {
      type: "scroll_state";
      region: Region;
      depth: number;
      milestones: number[];
      shortPage: boolean;
    }
  | {
      type: "interaction";
      action: "scroll" | "click" | "key" | "pointer" | "touch";
    }
  | {
      type: "project_open" | "project_close";
      projectId: number;
      surface: "modal" | "detail";
    }
  | { type: "outbound_click"; target: TargetKey; projectId?: number }
);
export interface EventBatch {
  sessionId: string;
  ingestToken: string;
  pageViewId: string;
  path: string;
  pageStartedAt: string;
  sequence: number;
  droppedEvents: number;
  events: AnalyticsEvent[];
}
export interface SessionInput {
  requestId: string;
  consent: "granted";
  browserId: string | null;
  ref?: string;
  path: string;
  sourceOrigin?: string;
  utm?: Partial<Record<"source" | "medium" | "campaign", string>>;
}
export interface SessionCredentials {
  sessionId: string;
  ingestToken: string;
  expiresAt: string;
}
export interface LinkInput {
  companyLabel: string;
  position: string;
  submittedAt: string | null;
  note: string;
}
export interface TrackingLink extends LinkInput {
  shareToken: string;
  id: string;
  createdAt: string;
  disabledAt: string | null;
}
export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";
export interface AnalyticsFilter {
  from: string;
  to: string;
  linkId?: string;
  device?: DeviceType;
  includeSuspectedBots: boolean;
  includeTest: boolean;
  limit: number;
  cursor?: string;
}
export interface SessionRow {
  id: string;
  companyLabel: string | null;
  startedAt: string;
  lastReceivedAt: string;
  activeMs: number;
  maxDepth: number;
  projectViews: number;
  observedActivity: boolean;
  suspectedBot: boolean;
  isTest: boolean;
}
export interface DashboardData {
  summary: {
    sessions: number;
    browsers: number;
    medianActiveMs: number;
    observedSessions: number;
  };
  links: {
    linkId: string | null;
    companyLabel: string | null;
    sessions: number;
    observedSessions: number;
  }[];
  sessions: SessionRow[];
  nextCursor: string | null;
}
export interface SessionDetailData {
  session: SessionRow;
  pages: {
    id: string;
    path: string;
    startedAt: string;
    activeMs: number;
    maxDepth: number;
    regions: {
      region: Region;
      visibleMs: number;
      activeMs: number;
      entries: number;
      maxDepth: number;
    }[];
  }[];
  timeline: { pageViewId: string; atMs: number; event: AnalyticsEvent }[];
  droppedEvents: number;
}
