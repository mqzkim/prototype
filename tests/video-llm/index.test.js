import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VideoRouter,
  PROVIDERS,
  ROUTING_RULES,
  DEFAULT_OPTIONS,
  BaseAdapter,
  VeoAdapter,
  KlingAdapter,
  GeminiAdapter,
  createVideoRouter,
} from '../../src/video-llm/index.js';

describe('video-llm/index.js exports', () => {
  it('exports VideoRouter class', () => {
    assert.equal(typeof VideoRouter, 'function');
  });

  it('exports PROVIDERS object', () => {
    assert.equal(typeof PROVIDERS, 'object');
    assert.ok(Object.keys(PROVIDERS).length > 0);
  });

  it('exports ROUTING_RULES object', () => {
    assert.equal(typeof ROUTING_RULES, 'object');
  });

  it('exports DEFAULT_OPTIONS object', () => {
    assert.equal(typeof DEFAULT_OPTIONS, 'object');
    assert.ok(DEFAULT_OPTIONS.resolution);
  });

  it('exports BaseAdapter class', () => {
    assert.equal(typeof BaseAdapter, 'function');
  });

  it('exports VeoAdapter class', () => {
    assert.equal(typeof VeoAdapter, 'function');
  });

  it('exports KlingAdapter class', () => {
    assert.equal(typeof KlingAdapter, 'function');
  });

  it('exports GeminiAdapter class', () => {
    assert.equal(typeof GeminiAdapter, 'function');
  });

  it('createVideoRouter returns VideoRouter instance', () => {
    const router = createVideoRouter({});
    assert.ok(router instanceof VideoRouter);
  });
});
