"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getBrowserId, type Consent } from "@/lib/analytics/consent";
import { startTracker } from "@/lib/analytics/tracker";
import { createTransport, splitBatches } from "@/lib/analytics/transport";
import { pathSchema } from "@/lib/analytics/schema";
import type {
  SessionCredentials,
  SessionInput,
  AnalyticsEvent,
} from "@/lib/analytics/types";
export default function PortfolioTracker({
  consent,
  enabled,
}: {
  consent: Consent;
  enabled: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const search = params.toString();
  const [generation, setGeneration] = useState(0);
  const attribution = useRef<{ ref?: string; utm?: SessionInput["utm"] }>({});
  const credentials = useRef<SessionCredentials | null>(null);
  const request = useRef<SessionInput | null>(null);
  const lastActivity = useRef(0);
  const sharedTransport = useRef<ReturnType<typeof createTransport> | null>(
    null,
  );
  const transportAbort = useRef<AbortController | null>(null);
  const rolloverEvents = useRef<AnalyticsEvent[]>([]);
  const currentAllowed = useRef(false);
  currentAllowed.current = consent === "granted" && enabled;
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (
      ref ||
      ["utm_source", "utm_medium", "utm_campaign"].some((k) =>
        url.searchParams.has(k),
      )
    ) {
      if (ref) {
        attribution.current.ref = /^[\w-]{22,64}$/.test(ref) ? ref : undefined;
        credentials.current = null;
        request.current = null;
      }
      const utm: SessionInput["utm"] = {};
      for (const key of ["source", "medium", "campaign"] as const) {
        const value = url.searchParams.get("utm_" + key);
        if (value) utm[key] = value.slice(0, 100);
        url.searchParams.delete("utm_" + key);
      }
      attribution.current.utm = utm;
      url.searchParams.delete("ref");
      router.replace(url.pathname + url.search + url.hash, { scroll: false });
      return;
    }
    if (!currentAllowed.current || !pathSchema.safeParse(pathname).success) {
      credentials.current = null;
      request.current = null;
      rolloverEvents.current = [];
      sharedTransport.current?.stop();
      sharedTransport.current = null;
      transportAbort.current?.abort();
      transportAbort.current = null;
      return;
    }
    let alive = true;
    let tracker: ReturnType<typeof startTracker> | null = null;
    const abort = new AbortController();
    if (!sharedTransport.current) {
      const controller = new AbortController();
      transportAbort.current = controller;
      sharedTransport.current = createTransport(async (batch) => {
        const response = await fetch("/api/analytics/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(batch),
          signal: controller.signal,
        });
        if (
          (response.status === 401 || response.status === 410) &&
          currentAllowed.current &&
          credentials.current?.sessionId === batch.sessionId
        ) {
          credentials.current = null;
          request.current = null;
          setGeneration((value) => value + 1);
        }
        return {
          status: response.status,
          retryAfter: Number(response.headers.get("retry-after") ?? 60),
        };
      });
    }
    const transport = sharedTransport.current;
    let booting = false;
    let bootRetryAt = 0;
    const pageViewId = crypto.randomUUID();
    const pageStartedAt = new Date().toISOString();
    let sequence = 0;
    async function boot() {
      if (booting || !alive || !currentAllowed.current) return;
      booting = true;
      try {
        const now = Date.now();
        if (
          credentials.current &&
          (now - lastActivity.current >= 1800000 ||
            now >= Date.parse(credentials.current.expiresAt))
        ) {
          credentials.current = null;
          request.current = null;
        }
        if (!credentials.current) {
          let sourceOrigin: string | undefined;
          try {
            sourceOrigin = document.referrer
              ? new URL(document.referrer).origin
              : undefined;
          } catch {}
          request.current ??= {
            requestId: crypto.randomUUID(),
            consent: "granted",
            browserId: getBrowserId(),
            path: pathname,
            ...attribution.current,
            ...(sourceOrigin ? { sourceOrigin } : {}),
          };
          let response: Response | null = null;
          for (let attempt = 0; attempt < 3 && alive; attempt++) {
            try {
              response = await fetch("/api/analytics/session", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(request.current),
                signal: abort.signal,
              });
              if (
                response.ok ||
                (response.status < 500 && response.status !== 429)
              )
                break;
            } catch {
              if (!alive) return;
            }
            await new Promise((resolve) =>
              setTimeout(
                resolve,
                response?.status === 429 ? 60000 : 1000 * (attempt + 1),
              ),
            );
          }
          if (!response?.ok || !alive) {
            bootRetryAt = response && response.status >= 400 && response.status < 500 && response.status !== 429 ? Infinity : Date.now() + 30000;
            return;
          }
          const nextCredentials: SessionCredentials = await response.json();
          if (!alive || !currentAllowed.current) return;
          credentials.current = nextCredentials;
          lastActivity.current = Date.now();
          attribution.current = {};
          request.current = null;
        }
        if (!alive || !currentAllowed.current || !credentials.current) return;
        const session = credentials.current;
        let rolling = false;
        if (rolloverEvents.current.length) {
          const deferred = splitBatches({sessionId:session.sessionId,ingestToken:session.ingestToken,pageViewId,path:pathname,pageStartedAt,sequence,droppedEvents:0,events:rolloverEvents.current.splice(0)});
          sequence += deferred.length; deferred.forEach(batch=>transport.enqueue(batch)); void transport.flush();
        }
        tracker = startTracker({
          root: document,
          onDeferredEvent: (event) => { if (rolloverEvents.current.length < 50) rolloverEvents.current.push(event); },
          onActivity: (action) => {
            const now = Date.now();
            if (rolling || now - lastActivity.current >= 1800000 || now >= Date.parse(session.expiresAt)) {
              rolling = true;
              if (rolloverEvents.current.length < 50) rolloverEvents.current.push({type:"interaction",action,atMs:0});
              credentials.current = null;
              setGeneration((v) => v + 1);
              lastActivity.current = now;
              return false;
            }
            lastActivity.current = now;
            return true;
          },
          emit: (events: AnalyticsEvent[], pendingDropped: number) => {
            if (!currentAllowed.current || !alive) return;
            const batches = splitBatches({
              sessionId: session.sessionId,
              ingestToken: session.ingestToken,
              pageViewId,
              path: pathname,
              pageStartedAt,
              sequence,
              droppedEvents: transport.takeDropped() + pendingDropped,
              events,
            });
            sequence += batches.length;
            for (const batch of batches) transport.enqueue(batch);
            void transport.flush();
          },
        });
      } catch {
        bootRetryAt = Date.now() + 30000;
      } finally {
        booting = false;
      }
    }
    void boot();
    const retry = setInterval(() => {
      void transport.flush();
      if (!tracker && !booting && Date.now() >= bootRetryAt) void boot();
      if (
        credentials.current &&
        Date.now() >= Date.parse(credentials.current.expiresAt)
      ) {
        credentials.current = null;
        setGeneration((v) => v + 1);
      }
    }, 1000);
    function beacon() {
      tracker?.flush();
      if (!currentAllowed.current) return;
      for (const batch of transport.pending()) {
        const body = JSON.stringify(batch);
        if (
          !navigator.sendBeacon(
            "/api/analytics/events",
            new Blob([body], { type: "application/json" }),
          )
        )
          void fetch("/api/analytics/events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
      }
    }
    const hidden = () => {
      if (document.visibilityState === "hidden") beacon();
    };
    const restored = (e: PageTransitionEvent) => {
      if (e.persisted) setGeneration((v) => v + 1);
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", beacon);
    window.addEventListener("pageshow", restored);
    return () => {
      tracker?.stop(currentAllowed.current);
      if (currentAllowed.current) beacon();
      alive = false;
      if (!currentAllowed.current) {
        transport.stop();
        sharedTransport.current = null;
        transportAbort.current?.abort();
        transportAbort.current = null;
      }
      abort.abort();
      clearInterval(retry);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", beacon);
      window.removeEventListener("pageshow", restored);
    };
  }, [pathname, search, consent, enabled, generation, router]);
  return null;
}
