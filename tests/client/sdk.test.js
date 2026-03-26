import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer } from '../../src/server/index.js';
import { createClient, VideoLLMClient } from '../../src/client/index.js';
import { clearCache } from '../../src/server/utils/api-keys.js';
import { clearRateLimits } from '../../src/server/middleware/rate-limit.js';

const PORT = 9877;
let app, client;

describe('VideoLLMClient SDK', () => {
  before(async () => {
    clearCache();
    clearRateLimits();
    app = createServer({ port: PORT });
    await app.listen(PORT);
    client = createClient(`http://localhost:${PORT}`, 'vllm_test_pro_001');
  });

  after(async () => {
    await app.close();
  });

  it('createClient returns VideoLLMClient instance', () => {
    assert.ok(client instanceof VideoLLMClient);
  });

  it('health() returns server health', async () => {
    const health = await client.health();
    assert.strictEqual(health.status, 'healthy');
    assert.ok(health.version);
  });

  it('listModels() returns models array', async () => {
    const data = await client.listModels();
    assert.ok(Array.isArray(data.models));
    assert.ok(data.models.length >= 6);
  });

  it('listModels(type) filters correctly', async () => {
    const data = await client.listModels('understanding');
    for (const m of data.models) {
      assert.strictEqual(m.type, 'understanding');
    }
  });

  it('compareCosts() returns sorted costs', async () => {
    const data = await client.compareCosts({ duration: 10, resolution: '1080p' });
    assert.ok(Array.isArray(data.costs));
    assert.ok(data.costs.length >= 3);
  });

  it('generate() creates a generation job', async () => {
    const result = await client.generate({ prompt: 'A sunrise over mountains' });
    assert.ok(result.id.startsWith('gen_'));
    assert.strictEqual(result.status, 'processing');
    assert.ok(result.estimatedCost >= 0);
  });

  it('analyze() creates an analysis job', async () => {
    const result = await client.analyze({ videoUrl: 'https://example.com/v.mp4' });
    assert.ok(result.id.startsWith('ana_'));
    assert.strictEqual(result.status, 'processing');
  });

  it('usage() returns usage stats', async () => {
    const data = await client.usage();
    assert.ok(data.tier);
    assert.ok(data.summary);
  });

  it('throws on invalid API key', async () => {
    const badClient = createClient(`http://localhost:${PORT}`, 'bad_key');
    await assert.rejects(() => badClient.listModels(), /Invalid API key/);
  });
});
