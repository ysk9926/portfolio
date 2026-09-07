import { calculateDepth, chooseRegion, createMeasurement } from "./measurement";
import { SECTION_KEYS, TARGET_KEYS } from "./constants";
import type { AnalyticsEvent, Region, SectionKey, TargetKey } from "./types";
export function startTracker(options: {
  root: Document;
  emit: (events: AnalyticsEvent[], droppedEvents: number) => void;
  onActivity: (action: "scroll" | "click" | "key" | "pointer" | "touch") => boolean;
  onDeferredEvent?: (event: AnalyticsEvent) => void;
}) {
  const doc = options.root;
  const win = doc.defaultView!;
  const started = performance.now();
  const now = () => Math.round(performance.now() - started);
  const m = createMeasurement(0);
  m.setVisible(doc.visibilityState === "visible", 0);
  let stopped = false,
    frame: ReturnType<typeof setTimeout> | null = null,
    project: Region | null = null;
  const visible = new Set<Element>();
  const depths = new Map<string, { max: number; seen: Set<number> }>();
  const interactions = new Set<string>();
  let scrollIntentAt = -Infinity;
  const pending: AnalyticsEvent[] = [{ type: "page_start", atMs: 0 }];
  let pendingDropped = 0;
  const push = (event: AnalyticsEvent) => {
    if (pending.length >= 200) { pending.shift(); pendingDropped++; }
    pending.push(event);
  };
  const regionFor = (element: Element): Region | null => {
    const id = Number(element.getAttribute("data-analytics-project"));
    if (Number.isSafeInteger(id) && id > 0)
      return {
        kind: "project",
        projectId: id,
        surface:
          element.getAttribute("data-analytics-surface") === "modal"
            ? "modal"
            : "detail",
      };
    const key = element.getAttribute("data-analytics-section");
    return SECTION_KEYS.includes(key as SectionKey)
      ? { kind: "section", key: key as SectionKey }
      : null;
  };
  function snapshot() {
    if (stopped || doc.visibilityState !== "visible") return;
    const candidates: { region: Region; area: number; order: number }[] = [];
    const modal = doc.querySelector('[data-analytics-surface="modal"]');
    const detail = doc.querySelector('[data-analytics-surface="detail"]');
    const nextProject = modal
      ? regionFor(modal)
      : detail
        ? regionFor(detail)
        : null;
    if (JSON.stringify(nextProject) !== JSON.stringify(project)) {
      if (project?.kind === "project")
        push({
          type: "project_close",
          atMs: now(),
          projectId: project.projectId,
          surface: project.surface,
        });
      project = nextProject;
      if (project?.kind === "project")
        push({
          type: "project_open",
          atMs: now(),
          projectId: project.projectId,
          surface: project.surface,
        });
    }
    const elements = Array.from(
      doc.querySelectorAll(
        "[data-analytics-section],[data-analytics-project][data-analytics-surface]",
      ),
    );
    elements.forEach((element, order) => {
      const r = element.getBoundingClientRect();
      const area =
        Math.max(0, Math.min(win.innerWidth, r.right) - Math.max(0, r.left)) *
        Math.max(0, Math.min(win.innerHeight, r.bottom) - Math.max(0, r.top));
      const region = regionFor(element);
      const exposed = area > 0 && (!modal || element === modal);
      if (exposed && region) {
        candidates.push({ region, area, order });
        if (!visible.has(element))
          push({ type: "region_enter", region, atMs: now() });
        visible.add(element);
      } else visible.delete(element);
    });
    const chosen = project ?? chooseRegion(candidates, currentRegion);
    currentRegion = chosen;
    m.setRegion(chosen, now());
    const scroller = modal ?? doc.scrollingElement ?? doc.documentElement;
    const region: Region = modal && project ? project : { kind: "page" };
    const key = JSON.stringify(region);
    const current = depths.get(key) ?? { max: 0, seen: new Set<number>() };
    const depth = calculateDepth(
      scroller.scrollTop,
      scroller.scrollHeight,
      modal ? scroller.clientHeight : win.innerHeight,
    );
    const milestones = [25, 50, 75, 90, 100].filter(
      (v) => v <= depth && !current.seen.has(v),
    );
    if (depth > current.max || !depths.has(key) || milestones.length) {
      current.max = Math.max(depth, current.max);
      milestones.forEach((v) => current.seen.add(v));
      push({
        type: "scroll_state",
        atMs: now(),
        region,
        depth: current.max,
        milestones,
        shortPage:
          scroller.scrollHeight <=
          (modal ? scroller.clientHeight : win.innerHeight),
      });
      depths.set(key, current);
    }
  }
  let currentRegion: Region | null = null;
  function schedule() {
    if (frame === null)
      frame = setTimeout(() => {
        frame = null;
        snapshot();
      }, 200);
  }
  function activity(
    action: "scroll" | "click" | "key" | "pointer" | "touch",
    event: Event,
  ) {
    if (!event.isTrusted || doc.visibilityState !== "visible") return;
    if (!options.onActivity(action)) return false;
    m.activity(now());
    if (!interactions.has(action)) {
      push({ type: "interaction", atMs: now(), action });
      interactions.add(action);
    }
    schedule();
    return true;
  }
  const onScroll = (e: Event) => {
    const modal = doc.querySelector('[data-analytics-surface="modal"]');
    if (
      modal &&
      e.target !== modal &&
      !(e.target instanceof Node && modal.contains(e.target))
    )
      return;
    if (performance.now() - scrollIntentAt < 1500) activity("scroll", e);
    else schedule();
  };
  const onKey = (e: Event) => {
    if (e.isTrusted) scrollIntentAt = performance.now();
    activity("key", e);
  };
  const onPointer = (e: Event) => {
    if (e.isTrusted) scrollIntentAt = performance.now();
    activity("pointer", e);
  };
  const onTouch = (e: Event) => {
    if (e.isTrusted) scrollIntentAt = performance.now();
    activity("touch", e);
  };
  const onWheel = (e: Event) => {
    if (e.isTrusted) scrollIntentAt = performance.now();
  };
  const onClick = (e: Event) => {
    const active = activity("click", e);
    if (!e.isTrusted || !(e.target instanceof Element)) return;
    const link = e.target.closest("[data-analytics-target]");
    const target = link?.getAttribute("data-analytics-target") as TargetKey;
    if (!TARGET_KEYS.includes(target)) return;
    const id = Number(link?.getAttribute("data-analytics-project-id"));
    const click: AnalyticsEvent = {
      type: "outbound_click",
      atMs: now(),
      target,
      ...(Number.isSafeInteger(id) && id > 0 ? { projectId: id } : {}),
    };
    if (!active) { options.onDeferredEvent?.({...click, atMs:0}); return; }
    push(click);
    flush();
  };
  function flush() {
    if (stopped) return;
    const events = [...pending.splice(0), ...m.drain(now())];
    interactions.clear();
    if (events.length) options.emit(events, pendingDropped);
    pendingDropped = 0;
  }
  const onVisibility = () => {
    m.setVisible(doc.visibilityState === "visible", now());
    if (doc.visibilityState === "visible") snapshot();
    else {
      visible.clear();
      flush();
    }
  };
  const observer = new MutationObserver(schedule);
  observer.observe(doc.body, { childList: true, subtree: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(doc.body);
  const intersection = new IntersectionObserver(schedule);
  doc
    .querySelectorAll("[data-analytics-section]")
    .forEach((el) => intersection.observe(el));
  doc.addEventListener("wheel", onWheel, { passive: true });
  doc.addEventListener("scroll", onScroll, true);
  doc.addEventListener("click", onClick, true);
  doc.addEventListener("pointermove", onPointer, { passive: true });
  doc.addEventListener("keydown", onKey);
  doc.addEventListener("touchstart", onTouch, { passive: true });
  doc.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("resize", schedule);
  snapshot();
  const interval = setInterval(flush, 15000);
  return {
    flush,
    stop(record = true) {
      if (stopped) return;
      if (record) {
        if (project?.kind === "project")
          push({
            type: "project_close",
            atMs: now(),
            projectId: project.projectId,
            surface: project.surface,
          });
        flush();
      }
      stopped = true;
      clearInterval(interval);
      if (frame) clearTimeout(frame);
      observer.disconnect();
      resize.disconnect();
      intersection.disconnect();
      doc.removeEventListener("wheel", onWheel);
      doc.removeEventListener("scroll", onScroll, true);
      doc.removeEventListener("click", onClick, true);
      doc.removeEventListener("pointermove", onPointer);
      doc.removeEventListener("keydown", onKey);
      doc.removeEventListener("touchstart", onTouch);
      doc.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("resize", schedule);
    },
  };
}
