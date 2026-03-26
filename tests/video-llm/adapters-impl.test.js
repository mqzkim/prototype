import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VeoAdapter } from '../../src/video-llm/adapters/veo.js';
import { KlingAdapter } from '../../src/video-llm/adapters/kling.js';
import { GeminiAdapter } from '../../src/video-llm/adapters/gemini.js';
import { PROVIDERS } from '../../src/video-llm/config.js';

describe('VeoAdapter', () => {
  const adapter = new VeoAdapter(PROVIDERS.veo, 'test-api-key');

  it('constructor sets properties correctly', () => {
    assert.equal(adapter.id, 'veo');
    assert.equal(adapter.name, 'Google Veo 3.1');
    assert.equal(adapter.apiKey, 'test-api-key');
    assert.equal(adapter.baseUrl, PROVIDERS.veo.apiBase);
  });

  it('estimateCost returns correct structure', () => {
    const cost = adapter.estimateCost(5, '1080p');
    assert.ok(cost);
    assert.equal(cost.currency, 'USD');
    assert.equal(cost.rate, 0.20);
    assert.equal(cost.cost, 1.0);
  });

  it('supports text-to-video', () => {
    assert.ok(adapter.supports('text-to-video'));
  });

  it('getStatus returns active', () => {
    assert.equal(adapter.getStatus(), 'active');
  });

  it('getCapabilities returns array', () => {
    const caps = adapter.getCapabilities();
    assert.ok(Array.isArray(caps));
    assert.ok(caps.includes('audio-sync'));
  });
});

describe('KlingAdapter', () => {
  const adapter = new KlingAdapter(PROVIDERS.kling, 'test-kling-key');

  it('constructor sets properties correctly', () => {
    assert.equal(adapter.id, 'kling');
    assert.equal(adapter.name, 'Kling 3.0');
    assert.equal(adapter.apiKey, 'test-kling-key');
  });

  it('estimateCost at lowest rate', () => {
    const cost = adapter.estimateCost(10, '720p');
    assert.ok(cost);
    assert.equal(cost.rate, 0.01);
    assert.equal(cost.cost, 0.10);
  });

  it('supports multi-shot', () => {
    assert.ok(adapter.supports('multi-shot'));
  });
});

describe('GeminiAdapter', () => {
  const adapter = new GeminiAdapter(PROVIDERS.gemini, 'test-gemini-key');

  it('constructor sets properties correctly', () => {
    assert.equal(adapter.id, 'gemini');
    assert.equal(adapter.name, 'Gemini 3 Pro');
    assert.equal(adapter.apiKey, 'test-gemini-key');
  });

  it('supports video-qa', () => {
    assert.ok(adapter.supports('video-qa'));
  });

  it('supports temporal-reasoning', () => {
    assert.ok(adapter.supports('temporal-reasoning'));
  });

  it('estimateCost returns null for understanding models', () => {
    const cost = adapter.estimateCost(5, '1080p');
    assert.equal(cost, null);
  });
});
