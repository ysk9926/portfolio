import type { AnalyticsFilter, DeviceType } from './types';

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEVICES = new Set<DeviceType>(['desktop', 'mobile', 'tablet', 'unknown']);

type SessionCursor = { startedAt: string; id: string };

export class AnalyticsFilterError extends Error {
  readonly status = 400;
  readonly code = 'invalid_filter';

  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsFilterError';
  }
}

const parseKoreanDate = (value: string, name: string) => {
  if (!DATE_PATTERN.test(value)) throw new AnalyticsFilterError(`Invalid ${name}`);
  const [year, month, day] = value.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day) - KST_OFFSET_MS;
  const date = new Date(utc);
  const korean = new Date(utc + KST_OFFSET_MS);
  if (
    korean.getUTCFullYear() !== year
    || korean.getUTCMonth() !== month - 1
    || korean.getUTCDate() !== day
  ) {
    throw new AnalyticsFilterError(`Invalid ${name}`);
  }
  return date;
};

const koreanCalendarDate = (now: Date) => {
  const date = new Date(now.getTime() + KST_OFFSET_MS);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - KST_OFFSET_MS);
};

const parseBoolean = (params: URLSearchParams, name: string) => {
  const value = params.get(name);
  if (value === null || value === 'false' || value === '0') return false;
  if (value === 'true' || value === '1') return true;
  throw new AnalyticsFilterError(`Invalid ${name}`);
};

export const decodeSessionCursor = (cursor: string): SessionCursor => {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    const keys = Object.keys(parsed);
    if (keys.length !== 2 || !keys.includes('startedAt') || !keys.includes('id')) throw new Error();
    const { startedAt, id } = parsed as Record<string, unknown>;
    if (typeof startedAt !== 'string' || !Number.isFinite(Date.parse(startedAt))) throw new Error();
    if (new Date(startedAt).toISOString() !== startedAt || typeof id !== 'string' || !UUID_PATTERN.test(id)) {
      throw new Error();
    }
    return { startedAt, id };
  } catch {
    throw new AnalyticsFilterError('Invalid cursor');
  }
};

export const encodeSessionCursor = (cursor: SessionCursor) =>
  Buffer.from(JSON.stringify(cursor)).toString('base64url');

export const parseAnalyticsFilter = (params: URLSearchParams, now: Date): AnalyticsFilter => {
  const fromValue = params.get('from');
  const toValue = params.get('to');
  if ((fromValue === null) !== (toValue === null)) {
    throw new AnalyticsFilterError('from and to must be provided together');
  }

  let from: Date;
  let to: Date;
  if (fromValue && toValue) {
    from = parseKoreanDate(fromValue, 'from');
    to = new Date(parseKoreanDate(toValue, 'to').getTime() + DAY_MS);
  } else {
    to = new Date(koreanCalendarDate(now).getTime() + DAY_MS);
    from = new Date(to.getTime() - 7 * DAY_MS);
  }

  const duration = to.getTime() - from.getTime();
  if (duration <= 0) throw new AnalyticsFilterError('from must be on or before to');
  if (duration > 90 * DAY_MS) throw new AnalyticsFilterError('Analytics ranges must be 90 days or fewer');

  const deviceValue = params.get('device');
  if (deviceValue !== null && !DEVICES.has(deviceValue as DeviceType)) {
    throw new AnalyticsFilterError('Invalid device');
  }
  const linkId = params.get('linkId');
  if (linkId !== null && !UUID_PATTERN.test(linkId)) throw new AnalyticsFilterError('Invalid linkId');

  const limitValue = params.get('limit');
  const limit = limitValue === null ? 50 : Number(limitValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AnalyticsFilterError('Invalid limit');

  const cursor = params.get('cursor') ?? undefined;
  if (cursor) decodeSessionCursor(cursor);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    ...(linkId ? { linkId } : {}),
    ...(deviceValue ? { device: deviceValue as DeviceType } : {}),
    includeSuspectedBots: parseBoolean(params, 'includeSuspectedBots'),
    includeTest: parseBoolean(params, 'includeTest'),
    limit,
    ...(cursor ? { cursor } : {}),
  };
};
