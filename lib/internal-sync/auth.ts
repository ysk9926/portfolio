export type PortfolioSyncAuthResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: 'Missing bearer token' | 'Invalid bearer token';
    };

export const assertPortfolioSyncToken = (
  headers: Headers,
  expectedToken: string,
): PortfolioSyncAuthResult => {
  const authorization = headers.get('authorization')?.trim();

  if (!authorization?.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Missing bearer token',
    };
  }

  const providedToken = authorization.slice('Bearer '.length).trim();

  if (!providedToken || providedToken !== expectedToken) {
    return {
      ok: false,
      status: 403,
      error: 'Invalid bearer token',
    };
  }

  return { ok: true };
};
