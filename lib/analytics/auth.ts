import { createHmac, timingSafeEqual } from "node:crypto";
export function issueIngestToken(
  session: { id: string; expiresAt: Date; isTest: boolean },
  secret: string,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      id: session.id,
      exp: session.expiresAt.getTime(),
      test: session.isTest,
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifyIngestToken(
  token: string,
  sessionId: string,
  now: Date,
  secret: string,
): boolean {
  try {
    if (token.length > 512 || secret.length < 32) return false;
    const [payload, signature, ...extra] = token.split(".");
    if (!payload || !signature || extra.length) return false;
    const actual = Buffer.from(signature, "base64url");
    const expected = createHmac("sha256", secret).update(payload).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return (
      data.v === 1 &&
      data.id === sessionId &&
      Number.isFinite(data.exp) &&
      data.exp > now.getTime()
    );
  } catch {
    return false;
  }
}
