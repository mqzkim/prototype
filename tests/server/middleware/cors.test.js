import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cors } from '../../../src/server/middleware/cors.js';

describe('CORS middleware', () => {
  function mockRes() {
    const res = {
      statusCode: 0,
      headers: {},
      body: '',
      setHeader(k, v) { res.headers[k] = v; },
      writeHead(code) { res.statusCode = code; },
      end(data) { res.body = data || ''; },
    };
    return res;
  }

  it('sets CORS headers on all requests', () => {
    const res = mockRes();
    cors({ method: 'GET' }, res);
    assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
    assert.ok(res.headers['Access-Control-Allow-Methods'].includes('GET'));
    assert.ok(res.headers['Access-Control-Allow-Headers'].includes('Authorization'));
    assert.equal(res.headers['Access-Control-Max-Age'], '86400');
  });

  it('returns true and sends 204 for OPTIONS', () => {
    const res = mockRes();
    const handled = cors({ method: 'OPTIONS' }, res);
    assert.equal(handled, true);
    assert.equal(res.statusCode, 204);
  });

  it('returns false for non-OPTIONS', () => {
    const res = mockRes();
    const handled = cors({ method: 'GET' }, res);
    assert.equal(handled, false);
  });
});
