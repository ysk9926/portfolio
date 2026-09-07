"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import {
  readConsent,
  saveConsent,
  CONSENT_KEY,
  type Consent,
} from "@/lib/analytics/consent";
import PortfolioTracker from "./PortfolioTracker";
import ConsentedGoogleAnalytics from "./ConsentedGoogleAnalytics";
type Config = { enabled: boolean; gaId: string | null };
const Context = createContext<{
  consent: Consent;
  enabled: boolean;
  openSettings: () => void;
}>({ consent: "unknown", enabled: false, openSettings: () => {} });
export const useAnalytics = () => useContext(Context);
export default function AnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [consent, setConsent] = useState<Consent>("unknown");
  const [config, setConfig] = useState<Config>({ enabled: false, gaId: null });
  const [opened, setOpened] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const sync = () => setConsent(readConsent());
    sync();
    setReady(true);
    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/analytics/config", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!r.ok) throw new Error("config");
        const data = await r.json();
        if (live)
          setConfig({
            enabled: data.enabled === true,
            gaId: data.gaId ?? null,
          });
      } catch {
        if (live) setConfig({ enabled: false, gaId: null });
      }
    }
    void refresh();
    const interval = setInterval(refresh, 60000);
    const storage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) sync();
    };
    window.addEventListener("storage", storage);
    return () => {
      live = false;
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("storage", storage);
    };
  }, []);
  const select = (value: Consent) => {
    saveConsent(value);
    setConsent(value);
    setOpened(false);
  };
  return (
    <Context.Provider
      value={{
        consent,
        enabled: config.enabled,
        openSettings: () => setOpened(true),
      }}
    >
      {children}
      <Suspense fallback={null}>
        <PortfolioTracker consent={consent} enabled={config.enabled} />
      </Suspense>
      <ConsentedGoogleAnalytics
        enabled={config.enabled && consent === "granted"}
        gaId={config.gaId}
      />
      {ready && (opened || (config.enabled && consent === "unknown")) && (
        <div
          role="dialog"
          aria-label="방문 분석 설정"
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl"
        >
          <p className="text-sm font-semibold">방문 분석 설정</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            어떤 내용이 도움이 되는지 확인하기 위해 방문 경로·스크롤·체류 시간을
            90일간 저장합니다. 허용하지 않아도 모든 내용을 볼 수 있습니다.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => select("denied")}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              거절
            </button>
            <button
              type="button"
              onClick={() => select("granted")}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white"
            >
              허용
            </button>
          </div>
        </div>
      )}
    </Context.Provider>
  );
}
