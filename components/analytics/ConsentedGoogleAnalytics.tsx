"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
// Only enabled after the operator disables GA Enhanced Measurement history events.
// Explicit, query-free pageviews prevent attribution tokens reaching Google.
export default function ConsentedGoogleAnalytics({
  enabled,
  gaId,
}: {
  enabled: boolean;
  gaId: string | null;
}) {
  const pathname = usePathname();
  const loadedId = useRef<string | null>(null);
  useEffect(() => {
    const globals = window as unknown as Record<string, unknown>;
    if (!enabled || !gaId || !/^G-[A-Z0-9]+$/.test(gaId)) {
      if (loadedId.current) {
        globals[`ga-disable-${loadedId.current}`] = true;
        loadedId.current = null;
        window.location.reload();
      }
      return;
    }
    globals[`ga-disable-${gaId}`] = false;
    if (!loadedId.current) {
      const init = document.createElement("script");
      init.text = `window.dataLayer=window.dataLayer||[]; window.gtag=function(){window.dataLayer.push(arguments)}; gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}); gtag('js',new Date()); gtag('config',${JSON.stringify(gaId)},{send_page_view:false,page_location:location.origin+location.pathname,page_referrer:''});`;
      document.head.appendChild(init);
      init.remove();
      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://www.googletagmanager.com/gtag/js?id=" +
        encodeURIComponent(gaId);
      document.head.appendChild(script);
      loadedId.current = gaId;
    }
  }, [enabled, gaId]);
  useEffect(() => {
    if (!enabled || !gaId || !loadedId.current) return;
    const globals = window as unknown as {
      gtag?: (...args: unknown[]) => void;
    };
    globals.gtag?.("event", "page_view", {
      page_location: window.location.origin + pathname,
      page_referrer: "",
    });
  }, [pathname, enabled, gaId]);
  useEffect(
    () => () => {
      if (loadedId.current)
        (window as unknown as Record<string, unknown>)[
          `ga-disable-${loadedId.current}`
        ] = true;
    },
    [],
  );
  return null;
}
