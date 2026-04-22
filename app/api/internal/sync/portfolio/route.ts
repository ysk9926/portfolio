import {
  exportPortfolioBootstrap,
  syncPortfolioSections,
} from '@/lib/internal-sync/db';
import {
  handlePortfolioSyncGet,
  handlePortfolioSyncPost,
} from '@/lib/internal-sync/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const expectedToken = () => process.env.PORTFOLIO_SYNC_API_TOKEN ?? '';

export async function GET(request: Request) {
  return handlePortfolioSyncGet(request, {
    expectedToken: expectedToken(),
    exportBootstrap: exportPortfolioBootstrap,
    syncSections: syncPortfolioSections,
  });
}

export async function POST(request: Request) {
  return handlePortfolioSyncPost(request, {
    expectedToken: expectedToken(),
    exportBootstrap: exportPortfolioBootstrap,
    syncSections: syncPortfolioSections,
  });
}
