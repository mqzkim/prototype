import { readFile } from 'fs/promises';
import { join } from 'path';

/** @type {{ keys: object[], tiers: object } | null} */
let cached = null;

/**
 * Load API keys from data/api-keys.json
 * @param {string} dataDir
 * @returns {Promise<{ keys: object[], tiers: object }>}
 */
export async function loadApiKeys(dataDir) {
  if (cached) return cached;
  const raw = await readFile(join(dataDir, 'api-keys.json'), 'utf-8');
  cached = JSON.parse(raw);
  return cached;
}

/**
 * Look up an API key and return its metadata
 * @param {string} dataDir
 * @param {string} key
 * @returns {Promise<{ userId: string, tier: string, active: boolean } | null>}
 */
export async function lookupKey(dataDir, key) {
  const data = await loadApiKeys(dataDir);
  const entry = data.keys.find((k) => k.key === key);
  if (!entry || !entry.active) return null;
  return { userId: entry.userId, tier: entry.tier, active: entry.active };
}

/**
 * Get tier configuration
 * @param {string} dataDir
 * @param {string} tier
 * @returns {Promise<{ rateLimit: number, monthlyQuota: number, price: number }>}
 */
export async function getTierConfig(dataDir, tier) {
  const data = await loadApiKeys(dataDir);
  return data.tiers[tier] || data.tiers.free;
}

/**
 * Clear cached keys (for testing)
 */
export function clearCache() {
  cached = null;
}
