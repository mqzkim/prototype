import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BaseAdapter } from '../../src/video-llm/adapters/base.js';
import { PROVIDERS } from '../../src/video-llm/config.js';

describe('BaseAdapter', () => {
  it('estimates cost correctly', () => {
    const adapter = new BaseAdapter(PROVIDERS.kling);
    const cost = adapter.estimateCost(10, '1080p');
    assert.ok(cost);
    assert.strictEqual(cost.currency, 'USD');
    assert.strictEqual(cost.cost, 0.02 * 10);
    assert.strictEqual(cost.unit, 'per_second');
  });

  it('returns null cost when no pricing', () => {
    const adapter = new BaseAdapter({ id: 'test', name: 'Test' });
    const cost = adapter.estimateCost(10, '1080p');
    assert.strictEqual(cost, null);
  });

  it('reports capabilities', () => {
    const adapter = new BaseAdapter(PROVIDERS.veo);
    assert.ok(adapter.supports('text-to-video'));
    assert.ok(adapter.supports('audio-sync'));
    assert.ok(!adapter.supports('nonexistent'));
  });

  it('throws on unimplemented generateVideo', async () => {
    const adapter = new BaseAdapter(PROVIDERS.kling);
    await assert.rejects(() => adapter.generateVideo({}), /not implemented/);
  });

  it('throws on unimplemented analyzeVideo', async () => {
    const adapter = new BaseAdapter(PROVIDERS.gemini);
    await assert.rejects(() => adapter.analyzeVideo({}), /not implemented/);
  });

  it('getStatus returns provider status', () => {
    const adapter = new BaseAdapter(PROVIDERS.kling);
    assert.strictEqual(adapter.getStatus(), 'active');
  });
});
