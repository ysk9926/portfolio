import { createHmac } from 'node:crypto';

export const createRateLimitKey = (value: string, secret: string) => {
  if (!secret) throw new Error('Missing analytics rate-limit secret');
  return createHmac('sha256', secret).update(value).digest('hex');
};
