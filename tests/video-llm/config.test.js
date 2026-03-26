import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, ROUTING_RULES, DEFAULT_OPTIONS } from '../../src/video-llm/config.js';

describe('video-llm/config.js', () => {
  describe('PROVIDERS', () => {
    const requiredIds = ['veo', 'kling', 'seedance', 'runway', 'hunyuan', 'wan', 'gemini', 'gpt4o'];

    it('has all expected provider IDs', () => {
      for (const id of requiredIds) {
        assert.ok(PROVIDERS[id], `Missing provider: ${id}`);
      }
    });

    it('each provider has required fields', () => {
      for (const [id, p] of Object.entries(PROVIDERS)) {
        assert.equal(p.id, id);
        assert.ok(typeof p.name === 'string', `${id}.name`);
        assert.ok(['generation', 'understanding'].includes(p.type), `${id}.type`);
        assert.ok(Array.isArray(p.capabilities), `${id}.capabilities`);
        assert.ok(typeof p.status === 'string', `${id}.status`);
      }
    });

    it('generation providers have pricingPerSec', () => {
      for (const p of Object.values(PROVIDERS)) {
        if (p.type === 'generation') {
          assert.ok(p.pricingPerSec || p.selfHosted, `${p.id} needs pricing or selfHosted`);
        }
      }
    });

    it('understanding providers have pricingPerMTok', () => {
      for (const p of Object.values(PROVIDERS)) {
        if (p.type === 'understanding') {
          assert.ok(p.pricingPerMTok, `${p.id} needs pricingPerMTok`);
        }
      }
    });
  });

  describe('ROUTING_RULES', () => {
    const strategies = ['best-quality', 'best-value', 'best-motion', 'self-hosted', 'cinema'];

    it('has all expected strategies', () => {
      for (const s of strategies) {
        assert.ok(ROUTING_RULES[s], `Missing strategy: ${s}`);
      }
    });

    it('each rule references valid providers', () => {
      for (const [name, rule] of Object.entries(ROUTING_RULES)) {
        if (rule.generation) {
          assert.ok(PROVIDERS[rule.generation], `${name}.generation => ${rule.generation} not in PROVIDERS`);
        }
        if (rule.understanding) {
          assert.ok(PROVIDERS[rule.understanding], `${name}.understanding => ${rule.understanding} not in PROVIDERS`);
        }
      }
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    it('has expected defaults', () => {
      assert.equal(DEFAULT_OPTIONS.resolution, '1080p');
      assert.equal(DEFAULT_OPTIONS.durationSec, 5);
      assert.equal(DEFAULT_OPTIONS.fps, 24);
      assert.equal(DEFAULT_OPTIONS.audioSync, false);
      assert.equal(DEFAULT_OPTIONS.routingStrategy, 'best-value');
    });
  });
});
