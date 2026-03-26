import { lookupKey } from '../utils/api-keys.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication middleware
 * Extracts Bearer token, validates against data/api-keys.json
 * Attaches req.apiKey, req.tier, req.userId on success
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} dataDir
 * @returns {Promise<boolean>} false if auth failed (response already sent)
 */
export async function auth(req, res, dataDir) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    sendError(res, 401, 'Missing or invalid Authorization header', 'AUTH_REQUIRED');
    return false;
  }
  const key = header.slice(7).trim();
  const entry = await lookupKey(dataDir, key);
  if (!entry) {
    sendError(res, 401, 'Invalid API key', 'INVALID_KEY');
    return false;
  }
  req.apiKey = key;
  req.tier = entry.tier;
  req.userId = entry.userId;
  return true;
}
