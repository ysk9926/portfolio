"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import PortfolioTracker from "./PortfolioTracker";
import ConsentedGoogleAnalytics from "./ConsentedGoogleAnalytics";
type Config = { enabled: boolean; gaId: string | null };
const Context = createContext<{
  enabled: boolean;
}>({ enabled: false });
export const useAnalytics = () => useContext(Context);
export default function AnalyticsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [config, setConfig] = useState<Config>({ enabled: false, gaId: null });
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
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
    return () => {
      live = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);
  return (
    <Context.Provider value={{ enabled: config.enabled }}>
      {children}
      <Suspense fallback={null}>
        <PortfolioTracker enabled={config.enabled} />
      </Suspense>
      <ConsentedGoogleAnalytics
        enabled={config.enabled}
        gaId={config.gaId}
      />
    </Context.Provider>
  );
}
