import { sendJSON } from '../utils/response.js';
import { PROVIDERS } from '../../video-llm/config.js';

/**
 * GET /v1/models — List available video LLM providers
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function modelsHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const typeFilter = url.searchParams.get('type');
  let models = Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    capabilities: p.capabilities,
    maxResolution: p.maxResolution || null,
    maxLengthSec: p.maxLengthSec || null,
    status: p.status,
  }));
  if (typeFilter) {
    models = models.filter((m) => m.type === typeFilter);
  }
  sendJSON(res, 200, { models });
}
