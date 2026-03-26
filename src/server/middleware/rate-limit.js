import { sendError } from '../utils/response.js';

/** @type {Map<string, { count: number, resetAt: number }>} */
const windows = new Map();

const WINDOW_MS = 60_000;

/**
 * Rate limiting middleware (in-memory sliding window)
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ rateLimit: number }} tierConfig
 * @returns {boolean} false if rate limited (response already sent)
 */
export function rateLimit(req, res, tierConfig) {
  const key = req.apiKey || 'anonymous';
  const limit = tierConfig.rateLimit || 10;
  const now = Date.now();
  let window = windows.get(key);
  if (!window || now >= window.resetAt) {
    window = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, window);
  }
  window.count++;
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - window.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(window.resetAt / 1000)));
  if (window.count > limit) {
    const retryAfter = Math.ceil((window.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    sendError(res, 429, 'Rate limit exceeded', 'RATE_LIMITED');
    return false;
  }
  return true;
}

/**
 * Clear all rate limit windows (for testing)
 */
export function clearRateLimits() {
  windows.clear();
}
