export type Consent = "unknown" | "granted" | "denied";
export const CONSENT_KEY = "portfolio:analytics:consent";
export const BROWSER_KEY = "portfolio:analytics:browser";
export function readConsent(): Consent {
  try {
    const s = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    return s?.version === 1 &&
      Date.now() - s.at < 180 * 86400000 &&
      (s.value === "granted" || s.value === "denied")
      ? s.value
      : "unknown";
  } catch {
    return "unknown";
  }
}
export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: 1, value, at: Date.now() }),
    );
    if (value !== "granted") localStorage.removeItem(BROWSER_KEY);
  } catch {}
}
export function getBrowserId(): string | null {
  try {
    const s = JSON.parse(localStorage.getItem(BROWSER_KEY) ?? "null");
    if (s?.id && Date.now() - s.at < 90 * 86400000) return s.id;
    const id = crypto.randomUUID();
    localStorage.setItem(BROWSER_KEY, JSON.stringify({ id, at: Date.now() }));
    return id;
  } catch {
    return null;
  }
}
