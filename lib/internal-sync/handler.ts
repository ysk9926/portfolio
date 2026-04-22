import {
  assertPortfolioSyncToken,
  type PortfolioSyncAuthResult,
} from './auth';
import {
  parsePortfolioSyncRequest,
  type PortfolioBootstrapPayloads,
  type PortfolioSyncPayloads,
  type PortfolioSyncSectionKey,
} from './schema';
import {
  PortfolioSectionSyncError,
  type PortfolioSyncResult,
} from './db';

export interface PortfolioSyncHandlerDeps {
  expectedToken: string;
  exportBootstrap: () => Promise<PortfolioBootstrapPayloads>;
  syncSections: (payloads: PortfolioSyncPayloads) => Promise<PortfolioSyncResult>;
}

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  Response.json(body, init);

const assertAuth = (
  headers: Headers,
  expectedToken: string,
): PortfolioSyncAuthResult => {
  return assertPortfolioSyncToken(headers, expectedToken);
};

export const handlePortfolioSyncGet = async (
  request: Request,
  deps: PortfolioSyncHandlerDeps,
) => {
  if (!deps.expectedToken) {
    return jsonResponse(
      { ok: false, error: 'Missing PORTFOLIO_SYNC_API_TOKEN' },
      { status: 500 },
    );
  }

  const authResult = assertAuth(request.headers, deps.expectedToken);
  if (!authResult.ok) {
    return jsonResponse(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  try {
    const payloads = await deps.exportBootstrap();
    return jsonResponse({
      ok: true,
      payloads,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }
};

export const handlePortfolioSyncPost = async (
  request: Request,
  deps: PortfolioSyncHandlerDeps,
) => {
  if (!deps.expectedToken) {
    return jsonResponse(
      { ok: false, error: 'Missing PORTFOLIO_SYNC_API_TOKEN' },
      { status: 500 },
    );
  }

  const authResult = assertAuth(request.headers, deps.expectedToken);
  if (!authResult.ok) {
    return jsonResponse(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          ok: false,
          error: 'Invalid JSON body',
        },
        { status: 400 },
      );
    }

    const parsed = parsePortfolioSyncRequest(body);

    if (!parsed.success) {
      return jsonResponse(
        {
          ok: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await deps.syncSections(parsed.data.payloads);

    return jsonResponse({
      ok: true,
      updatedSections: result.updatedSections,
      updatedAtBySection: result.updatedAtBySection,
    });
  } catch (cause) {
    if (cause instanceof PortfolioSectionSyncError) {
      return jsonResponse(
        {
          ok: false,
          error: 'Failed to sync portfolio sections',
          section: cause.section,
          details: cause.message,
        },
        { status: 500 },
      );
    }

    const message = cause instanceof Error ? cause.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }
};

export type {
  PortfolioBootstrapPayloads,
  PortfolioSyncPayloads,
  PortfolioSyncSectionKey,
};
