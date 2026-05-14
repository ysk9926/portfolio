import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEYLEN = 32;
const SCRYPT_PARAMS = { N: 1 << 14, r: 8, p: 1 };

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const [scheme, saltHex, derivedHex] = hash.split('$');
  if (scheme !== 'scrypt' || !saltHex || !derivedHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(derivedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
};

const IP_HASH_SECRET = process.env.BLOG_IP_HASH_SECRET || 'portfolio-blog-default';

export const hashIp = (ip: string): string =>
  createHash('sha256').update(`${IP_HASH_SECRET}:${ip}`).digest('hex');
