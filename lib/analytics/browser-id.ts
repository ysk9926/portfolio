export const BROWSER_KEY = "portfolio:analytics:browser";

export function getBrowserId(): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(BROWSER_KEY) ?? "null");
    if (stored?.id && Date.now() - stored.at < 90 * 86400000) {
      return stored.id;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(BROWSER_KEY, JSON.stringify({ id, at: Date.now() }));
    return id;
  } catch {
    return null;
  }
}
