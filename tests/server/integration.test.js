import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer } from '../../src/server/index.js';
import { clearCache } from '../../src/server/utils/api-keys.js';
import { clearRateLimits } from '../../src/server/middleware/rate-limit.js';

const PORT = 9876;
let app;

async function req(method, path, { body, apiKey } = {}) {
  const opts = { method, headers: {} };
  if (apiKey) opts.headers['Authorization'] = `Bearer ${apiKey}`;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`http://localhost:${PORT}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data, headers: res.headers };
}

describe('server integration', () => {
  before(async () => {
    clearCache();
    clearRateLimits();
    app = createServer({ port: PORT });
    await app.listen(PORT);
  });

  after(async () => {
    await app.close();
  });

  it('GET /v1/health returns 200 without auth', async () => {
    const { status, data } = await req('GET', '/v1/health');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.status, 'healthy');
    assert.ok(data.version);
    assert.ok(Array.isArray(data.providers));
    assert.ok(data.providers.length >= 6);
  });

  it('returns 401 for missing auth on protected routes', async () => {
    const { status, data } = await req('GET', '/v1/models');
    assert.strictEqual(status, 401);
    assert.ok(data.error.message.includes('Authorization'));
  });

  it('returns 401 for invalid API key', async () => {
    const { status } = await req('GET', '/v1/models', { apiKey: 'invalid_key' });
    assert.strictEqual(status, 401);
  });

  it('GET /v1/models returns providers with valid key', async () => {
    const { status, data } = await req('GET', '/v1/models', { apiKey: 'vllm_test_pro_001' });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data.models));
    assert.ok(data.models.length >= 6);
    const kling = data.models.find(m => m.id === 'kling');
    assert.ok(kling);
    assert.strictEqual(kling.type, 'generation');
  });

  it('GET /v1/models?type=understanding filters correctly', async () => {
    const { status, data } = await req('GET', '/v1/models?type=understanding', { apiKey: 'vllm_test_pro_001' });
    assert.strictEqual(status, 200);
    for (const m of data.models) {
      assert.strictEqual(m.type, 'understanding');
    }
  });

  it('GET /v1/costs returns sorted cost comparison', async () => {
    const { status, data } = await req('GET', '/v1/costs?duration=10&resolution=1080p', { apiKey: 'vllm_test_starter_001' });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data.costs));
    for (let i = 1; i < data.costs.length; i++) {
      assert.ok(data.costs[i].total >= data.costs[i - 1].total);
    }
  });

  it('POST /v1/generate returns 202 with valid params', async () => {
    const { status, data } = await req('POST', '/v1/generate', {
      apiKey: 'vllm_test_pro_001',
      body: { prompt: 'A cat on the moon', resolution: '1080p', durationSec: 5 },
    });
    assert.strictEqual(status, 202);
    assert.ok(data.id.startsWith('gen_'));
    assert.strictEqual(data.status, 'processing');
    assert.strictEqual(data.provider, 'kling');
    assert.ok(data.estimatedCost >= 0);
  });

  it('POST /v1/generate validates input', async () => {
    const { status, data } = await req('POST', '/v1/generate', {
      apiKey: 'vllm_test_pro_001',
      body: { resolution: '8k' },
    });
    assert.strictEqual(status, 400);
    assert.ok(data.error.message.includes('prompt'));
  });

  it('POST /v1/analyze returns 202 with valid params', async () => {
    const { status, data } = await req('POST', '/v1/analyze', {
      apiKey: 'vllm_test_pro_001',
      body: { videoUrl: 'https://example.com/video.mp4', prompt: 'What happens?' },
    });
    assert.strictEqual(status, 202);
    assert.ok(data.id.startsWith('ana_'));
    assert.strictEqual(data.provider, 'gemini');
  });

  it('POST /v1/analyze validates input', async () => {
    const { status } = await req('POST', '/v1/analyze', {
      apiKey: 'vllm_test_pro_001',
      body: {},
    });
    assert.strictEqual(status, 400);
  });

  it('GET /v1/usage returns usage stats', async () => {
    const { status, data } = await req('GET', '/v1/usage', { apiKey: 'vllm_test_pro_001' });
    assert.strictEqual(status, 200);
    assert.ok(data.tier);
    assert.ok(data.summary);
  });

  it('returns 404 for unknown routes', async () => {
    const { status } = await req('GET', '/v1/unknown', { apiKey: 'vllm_test_pro_001' });
    assert.strictEqual(status, 404);
  });

  it('returns 405 for wrong method', async () => {
    const { status } = await req('POST', '/v1/health');
    assert.strictEqual(status, 405);
  });

  it('handles CORS preflight', async () => {
    const res = await fetch(`http://localhost:${PORT}/v1/health`, { method: 'OPTIONS' });
    assert.strictEqual(res.status, 204);
    assert.ok(res.headers.get('access-control-allow-origin'));
  });

  it('includes rate limit headers', async () => {
    const { headers } = await req('GET', '/v1/models', { apiKey: 'vllm_test_free_001' });
    assert.ok(headers.get('x-ratelimit-limit'));
    assert.ok(headers.get('x-ratelimit-remaining'));
  });
});
