import { sendJSON, sendError, parseBody } from '../utils/response.js';
import { validateGenerateParams } from '../utils/validation.js';
import { PROVIDERS, ROUTING_RULES, DEFAULT_OPTIONS } from '../../video-llm/config.js';

/**
 * POST /v1/generate — Generate a video via the best available provider
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ usageTracker: import('../utils/usage-tracker.js').UsageTracker }} ctx
 */
export async function generateHandler(req, res, ctx) {
  let body;
  try { body = await parseBody(req); }
  catch (e) { sendError(res, 400, e.message); return; }

  const validation = validateGenerateParams(body);
  if (!validation.valid) {
    sendError(res, 400, validation.errors.join('; '), 'VALIDATION_ERROR');
    return;
  }

  const opts = { ...DEFAULT_OPTIONS, ...body };
  const strategy = opts.routingStrategy || 'best-value';
  const rule = ROUTING_RULES[strategy];
  const providerId = opts.provider || (rule && rule.generation) || 'kling';
  const provider = PROVIDERS[providerId];

  if (!provider) {
    sendError(res, 400, `Unknown provider: ${providerId}`, 'INVALID_PROVIDER');
    return;
  }

  const pricing = provider.pricingPerSec || {};
  const rate = pricing[opts.resolution] || pricing['1080p'] || Object.values(pricing)[0] || 0;
  const estimatedCost = typeof rate === 'number' ? +(rate * (opts.durationSec || 5)).toFixed(4) : null;

  const result = {
    id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'processing',
    provider: providerId,
    model: provider.name,
    params: {
      prompt: opts.prompt,
      resolution: opts.resolution,
      durationSec: opts.durationSec,
    },
    estimatedCost,
    createdAt: new Date().toISOString(),
  };

  if (ctx.usageTracker) {
    ctx.usageTracker.record({
      apiKey: req.apiKey,
      endpoint: '/v1/generate',
      provider: providerId,
      estimatedCost,
      status: 'success',
      durationMs: Date.now() - req._startTime,
    });
  }

  sendJSON(res, 202, result);
}
