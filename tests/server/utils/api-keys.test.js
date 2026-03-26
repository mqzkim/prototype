import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadApiKeys, lookupKey, getTierConfig, clearCache } from '../../../src/server/utils/api-keys.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

describe('API keys utils', () => {
  beforeEach(() => { clearCache(); });

  describe('loadApiKeys', () => {
    it('loads keys and tiers from data directory', async () => {
      const data = await loadApiKeys(DATA_DIR);
      assert.ok(Array.isArray(data.keys));
      assert.ok(data.keys.length > 0);
      assert.ok(typeof data.tiers === 'object');
    });

    it('uses cache on subsequent calls', async () => {
      const first = await loadApiKeys(DATA_DIR);
      const second = await loadApiKeys(DATA_DIR);
      assert.equal(first, second);
    });
  });

  describe('lookupKey', () => {
    it('returns entry for valid key', async () => {
      const entry = await lookupKey(DATA_DIR, 'vllm_test_free_001');
      assert.ok(entry);
      assert.equal(entry.userId, 'test-free');
      assert.equal(entry.tier, 'free');
      assert.equal(entry.active, true);
    });

    it('returns null for invalid key', async () => {
      const entry = await lookupKey(DATA_DIR, 'nonexistent_key');
      assert.equal(entry, null);
    });
  });

  describe('getTierConfig', () => {
    it('returns config for valid tier', async () => {
      const config = await getTierConfig(DATA_DIR, 'pro');
      assert.equal(config.rateLimit, 300);
      assert.equal(config.price, 79);
    });

    it('falls back to free tier for unknown tier', async () => {
      const config = await getTierConfig(DATA_DIR, 'unknown-tier');
      assert.equal(config.rateLimit, 10);
      assert.equal(config.price, 0);
    });
  });

  describe('clearCache', () => {
    it('clears cached data so next load is fresh', async () => {
      await loadApiKeys(DATA_DIR);
      clearCache();
      const data = await loadApiKeys(DATA_DIR);
      assert.ok(data.keys.length > 0);
    });
  });
});
