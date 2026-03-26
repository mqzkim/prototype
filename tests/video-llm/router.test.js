import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VideoRouter } from '../../src/video-llm/router.js';
import { PROVIDERS, ROUTING_RULES } from '../../src/video-llm/config.js';

describe('VideoRouter', () => {
  it('creates router with no API keys', () => {
    const router = new VideoRouter({});
    const status = router.getStatus();
    assert.strictEqual(status.totalProviders, Object.keys(PROVIDERS).length);
    assert.strictEqual(status.initializedProviders, 0);
  });

  it('lists all providers', () => {
    const router = new VideoRouter({});
    const providers = router.listProviders();
    assert.ok(providers.length >= 6);
    const gen = providers.filter(p => p.type === 'generation');
    const und = providers.filter(p => p.type === 'understanding');
    assert.ok(gen.length >= 4);
    assert.ok(und.length >= 2);
  });

  it('filters providers by type', () => {
    const router = new VideoRouter({});
    const gen = router.listProviders('generation');
    for (const p of gen) {
      assert.strictEqual(p.type, 'generation');
    }
  });

  it('compares costs across generation providers', () => {
    const router = new VideoRouter({});
    const costs = router.compareCosts(10, '1080p');
    assert.ok(Array.isArray(costs));
    assert.ok(costs.length >= 3);
    for (let i = 1; i < costs.length; i++) {
      assert.ok(costs[i].totalForDuration >= costs[i - 1].totalForDuration);
    }
  });

  it('getStatus returns supported strategies', () => {
    const router = new VideoRouter({});
    const status = router.getStatus();
    assert.ok(status.supportedStrategies.includes('best-quality'));
    assert.ok(status.supportedStrategies.includes('best-value'));
  });

  it('routing rules reference valid providers', () => {
    for (const [strategy, rule] of Object.entries(ROUTING_RULES)) {
      if (rule.generation) {
        assert.ok(PROVIDERS[rule.generation], `${strategy}.generation -> ${rule.generation}`);
      }
      if (rule.understanding) {
        assert.ok(PROVIDERS[rule.understanding], `${strategy}.understanding -> ${rule.understanding}`);
      }
    }
  });
});
