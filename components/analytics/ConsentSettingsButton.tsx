"use client";
import { useAnalytics } from "./AnalyticsProvider";
export default function ConsentSettingsButton() {
  const { openSettings } = useAnalytics();
  return (
    <button
      type="button"
      className="mt-4 text-xs text-neutral-400 underline underline-offset-4"
      onClick={openSettings}
    >
      방문 분석 설정
    </button>
  );
}
