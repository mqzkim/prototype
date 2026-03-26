import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { auth } from '../../../src/server/middleware/auth.js';
import { clearCache } from '../../../src/server/utils/api-keys.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

describe('Auth middleware', () => {
  beforeEach(() => { clearCache(); });

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

  it('returns false + 401 when no Authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const ok = await auth(req, res, DATA_DIR);
    assert.equal(ok, false);
    assert.equal(res.statusCode, 401);
    assert.ok(res.body.includes('AUTH_REQUIRED'));
  });

  it('returns false + 401 when header is not Bearer', async () => {
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = mockRes();
    const ok = await auth(req, res, DATA_DIR);
    assert.equal(ok, false);
    assert.equal(res.statusCode, 401);
  });

  it('returns false + 401 when API key is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid_key_xyz' } };
    const res = mockRes();
    const ok = await auth(req, res, DATA_DIR);
    assert.equal(ok, false);
    assert.equal(res.statusCode, 401);
    assert.ok(res.body.includes('INVALID_KEY'));
  });

  it('returns true and sets req properties on valid key', async () => {
    const req = { headers: { authorization: 'Bearer vllm_test_free_001' } };
    const res = mockRes();
    const ok = await auth(req, res, DATA_DIR);
    assert.equal(ok, true);
    assert.equal(req.apiKey, 'vllm_test_free_001');
    assert.equal(req.tier, 'free');
    assert.equal(req.userId, 'test-free');
  });
});
