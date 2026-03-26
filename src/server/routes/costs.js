import { sendJSON } from '../utils/response.js';
import { PROVIDERS } from '../../video-llm/config.js';

/**
 * GET /v1/costs — Compare costs across providers
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function costsHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const duration = Number(url.searchParams.get('duration')) || 5;
  const resolution = url.searchParams.get('resolution') || '1080p';
  const results = [];
  for (const [id, config] of Object.entries(PROVIDERS)) {
    if (config.type !== 'generation') continue;
    const pricing = config.pricingPerSec;
    if (!pricing) continue;
    const rate = pricing[resolution] || pricing['1080p'] || Object.values(pricing)[0];
    if (typeof rate !== 'number') continue;
    results.push({
      provider: id,
      name: config.name,
      rate,
      total: +(rate * duration).toFixed(4),
      currency: 'USD',
      resolution,
      duration,
    });
  }
  results.sort((a, b) => a.total - b.total);
  sendJSON(res, 200, { costs: results });
}
