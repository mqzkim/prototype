import { sendJSON, sendError, parseBody } from '../utils/response.js';
import { validateAnalyzeParams } from '../utils/validation.js';
import { PROVIDERS } from '../../video-llm/config.js';

/**
 * POST /v1/analyze — Analyze a video using an understanding model
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ usageTracker: import('../utils/usage-tracker.js').UsageTracker }} ctx
 */
export async function analyzeHandler(req, res, ctx) {
  let body;
  try { body = await parseBody(req); }
  catch (e) { sendError(res, 400, e.message); return; }

  const validation = validateAnalyzeParams(body);
  if (!validation.valid) {
    sendError(res, 400, validation.errors.join('; '), 'VALIDATION_ERROR');
    return;
  }

  const providerId = body.provider || 'gemini';
  const provider = PROVIDERS[providerId];

  if (!provider || provider.type !== 'understanding') {
    sendError(res, 400, `Invalid understanding provider: ${providerId}`, 'INVALID_PROVIDER');
    return;
  }

  const result = {
    id: `ana_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'processing',
    provider: providerId,
    model: provider.name,
    params: {
      videoUrl: body.videoUrl || null,
      prompt: body.prompt || 'Describe this video.',
    },
    createdAt: new Date().toISOString(),
  };

  if (ctx.usageTracker) {
    ctx.usageTracker.record({
      apiKey: req.apiKey,
      endpoint: '/v1/analyze',
      provider: providerId,
      estimatedCost: null,
      status: 'success',
      durationMs: Date.now() - req._startTime,
    });
  }

  sendJSON(res, 202, result);
}
