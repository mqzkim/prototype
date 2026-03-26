import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateGenerateParams, validateAnalyzeParams } from '../../../src/server/utils/validation.js';

describe('Validation utils', () => {
  describe('validateGenerateParams', () => {
    it('passes with valid params', () => {
      const r = validateGenerateParams({ prompt: 'A cat' });
      assert.equal(r.valid, true);
      assert.equal(r.errors.length, 0);
    });

    it('fails when body is null', () => {
      const r = validateGenerateParams(null);
      assert.equal(r.valid, false);
      assert.ok(r.errors[0].includes('JSON object'));
    });

    it('fails when prompt is missing', () => {
      const r = validateGenerateParams({});
      assert.equal(r.valid, false);
      assert.ok(r.errors.some(e => e.includes('prompt')));
    });

    it('fails on invalid resolution', () => {
      const r = validateGenerateParams({ prompt: 'test', resolution: '8k' });
      assert.equal(r.valid, false);
      assert.ok(r.errors.some(e => e.includes('resolution')));
    });

    it('fails on invalid durationSec', () => {
      const r = validateGenerateParams({ prompt: 'test', durationSec: 999 });
      assert.equal(r.valid, false);
      assert.ok(r.errors.some(e => e.includes('durationSec')));
    });

    it('passes with valid resolution and duration', () => {
      const r = validateGenerateParams({ prompt: 'test', resolution: '4k', durationSec: 10 });
      assert.equal(r.valid, true);
    });

    it('fails on non-string routingStrategy', () => {
      const r = validateGenerateParams({ prompt: 'test', routingStrategy: 123 });
      assert.equal(r.valid, false);
      assert.ok(r.errors.some(e => e.includes('routingStrategy')));
    });
  });

  describe('validateAnalyzeParams', () => {
    it('passes with videoUrl', () => {
      const r = validateAnalyzeParams({ videoUrl: 'https://example.com/v.mp4' });
      assert.equal(r.valid, true);
    });

    it('passes with videoBase64', () => {
      const r = validateAnalyzeParams({ videoBase64: 'base64data' });
      assert.equal(r.valid, true);
    });

    it('fails when body is null', () => {
      const r = validateAnalyzeParams(null);
      assert.equal(r.valid, false);
    });

    it('fails when neither videoUrl nor videoBase64 provided', () => {
      const r = validateAnalyzeParams({});
      assert.equal(r.valid, false);
      assert.ok(r.errors.some(e => e.includes('videoUrl')));
    });

    it('fails on non-string videoUrl', () => {
      const r = validateAnalyzeParams({ videoUrl: 123 });
      assert.equal(r.valid, false);
    });

    it('fails on non-string videoBase64', () => {
      const r = validateAnalyzeParams({ videoBase64: 123 });
      assert.equal(r.valid, false);
    });
  });
});
