import { sendJSON } from '../utils/response.js';
import { PROVIDERS } from '../../video-llm/config.js';

const startTime = Date.now();

/**
 * GET /v1/health — Server health check (no auth required)
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function healthHandler(req, res) {
  const providers = Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));
  sendJSON(res, 200, {
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '0.1.0',
    providers,
    timestamp: new Date().toISOString(),
  });
}
