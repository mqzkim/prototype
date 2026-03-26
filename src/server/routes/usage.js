import { sendJSON } from '../utils/response.js';

/**
 * GET /v1/usage — Get usage statistics for the authenticated API key
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ usageTracker: import('../utils/usage-tracker.js').UsageTracker }} ctx
 */
export async function usageHandler(req, res, ctx) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  const aggregated = await ctx.usageTracker.getAggregated(req.apiKey);
  const records = await ctx.usageTracker.getUsage(req.apiKey, { from, to });

  sendJSON(res, 200, {
    apiKey: req.apiKey.slice(0, 10) + '...',
    tier: req.tier,
    summary: aggregated,
    recentRecords: records.slice(-50),
  });
}
