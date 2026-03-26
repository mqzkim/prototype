import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from '../../src/server/router.js';

describe('Router', () => {
  function mockReq(method, url) {
    return { method, url, headers: { host: 'localhost' } };
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

  it('registers GET routes', () => {
    const r = new Router();
    r.get('/test', () => {});
    assert.equal(r.routes.length, 1);
    assert.equal(r.routes[0].method, 'GET');
    assert.equal(r.routes[0].path, '/test');
  });

  it('registers POST routes', () => {
    const r = new Router();
    r.post('/test', () => {});
    assert.equal(r.routes.length, 1);
    assert.equal(r.routes[0].method, 'POST');
  });

  it('handle() matches correct route by method + path', async () => {
    const r = new Router();
    let called = false;
    r.get('/v1/health', () => { called = true; });
    const matched = await r.handle(mockReq('GET', '/v1/health'), mockRes());
    assert.equal(matched, true);
    assert.equal(called, true);
  });

  it('handle() returns false for unmatched path', async () => {
    const r = new Router();
    r.get('/v1/health', () => {});
    const matched = await r.handle(mockReq('GET', '/v1/unknown'), mockRes());
    assert.equal(matched, false);
  });

  it('handle() returns 405 for wrong method', async () => {
    const r = new Router();
    r.get('/v1/health', () => {});
    const res = mockRes();
    const matched = await r.handle(mockReq('POST', '/v1/health'), res);
    assert.equal(matched, true);
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers['Allow'], 'GET');
  });

  it('handle() sets Allow header with multiple methods', async () => {
    const r = new Router();
    r.get('/v1/data', () => {});
    r.post('/v1/data', () => {});
    const res = mockRes();
    await r.handle(mockReq('DELETE', '/v1/data'), res);
    assert.equal(res.statusCode, 405);
    assert.ok(res.headers['Allow'].includes('GET'));
    assert.ok(res.headers['Allow'].includes('POST'));
  });

  it('handle() passes async handler errors', async () => {
    const r = new Router();
    r.get('/fail', async () => { throw new Error('boom'); });
    await assert.rejects(() => r.handle(mockReq('GET', '/fail'), mockRes()), { message: 'boom' });
  });
});
