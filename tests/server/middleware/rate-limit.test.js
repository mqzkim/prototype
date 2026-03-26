import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, clearRateLimits } from '../../../src/server/middleware/rate-limit.js';

describe('Rate limit middleware', () => {
  beforeEach(() => { clearRateLimits(); });

  function mockReq(apiKey) {
    return { apiKey };
  }

  function mockRes() {
    const res = {
      statusCode: 0,
      headers: {},
      body: '',
      setHeader(k, v) { res.headers[k] = v; },
      writeHead(code, h) { res.statusCode = code; Object.assign(res.headers, h || {}); },
      end(data) { res.body = data || ''; },
    };
    return res;
  }

  it('returns true when under limit', () => {
    const res = mockRes();
    const ok = rateLimit(mockReq('test-key'), res, { rateLimit: 10 });
    assert.equal(ok, true);
    assert.equal(res.headers['X-RateLimit-Limit'], '10');
    assert.equal(res.headers['X-RateLimit-Remaining'], '9');
  });

  it('returns false + 429 when over limit', () => {
    const tierConfig = { rateLimit: 2 };
    rateLimit(mockReq('key1'), mockRes(), tierConfig);
    rateLimit(mockReq('key1'), mockRes(), tierConfig);
    const res = mockRes();
    const ok = rateLimit(mockReq('key1'), res, tierConfig);
    assert.equal(ok, false);
    assert.equal(res.statusCode, 429);
    assert.ok(res.body.includes('RATE_LIMITED'));
  });

  it('sets X-RateLimit headers', () => {
    const res = mockRes();
    rateLimit(mockReq('hdr-key'), res, { rateLimit: 5 });
    assert.ok('X-RateLimit-Limit' in res.headers);
    assert.ok('X-RateLimit-Remaining' in res.headers);
    assert.ok('X-RateLimit-Reset' in res.headers);
  });

  it('clearRateLimits resets all windows', () => {
    const tierConfig = { rateLimit: 1 };
    rateLimit(mockReq('clear-key'), mockRes(), tierConfig);
    clearRateLimits();
    const res = mockRes();
    const ok = rateLimit(mockReq('clear-key'), res, tierConfig);
    assert.equal(ok, true);
    assert.equal(res.headers['X-RateLimit-Remaining'], '0');
  });

  it('uses default limit of 10 when not specified', () => {
    const res = mockRes();
    rateLimit(mockReq('default-key'), res, {});
    assert.equal(res.headers['X-RateLimit-Limit'], '10');
  });
});
