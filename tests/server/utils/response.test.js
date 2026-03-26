import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'stream';
import { sendJSON, sendError, parseBody } from '../../../src/server/utils/response.js';

describe('Response utils', () => {
  function mockRes() {
    const res = {
      statusCode: 0,
      headers: {},
      body: '',
      writeHead(code, h) { res.statusCode = code; Object.assign(res.headers, h || {}); },
      end(data) { res.body = data || ''; },
    };
    return res;
  }

  describe('sendJSON', () => {
    it('sends correct status and JSON body', () => {
      const res = mockRes();
      sendJSON(res, 200, { ok: true });
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(res.body), { ok: true });
    });

    it('sets Content-Length header', () => {
      const res = mockRes();
      sendJSON(res, 201, { id: 'abc' });
      assert.ok(Number(res.headers['Content-Length']) > 0);
    });
  });

  describe('sendError', () => {
    it('sends error object with message and code', () => {
      const res = mockRes();
      sendError(res, 400, 'Bad request', 'BAD_REQ');
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.equal(body.error.message, 'Bad request');
      assert.equal(body.error.code, 'BAD_REQ');
      assert.equal(body.error.status, 400);
    });

    it('defaults code to null', () => {
      const res = mockRes();
      sendError(res, 500, 'Internal error');
      const body = JSON.parse(res.body);
      assert.equal(body.error.code, null);
    });
  });

  describe('parseBody', () => {
    function createReadable(data) {
      const r = new Readable({ read() {} });
      if (data) r.push(data);
      r.push(null);
      return r;
    }

    it('parses valid JSON', async () => {
      const req = createReadable('{"name":"test"}');
      const body = await parseBody(req);
      assert.deepEqual(body, { name: 'test' });
    });

    it('returns empty object for empty body', async () => {
      const req = createReadable('');
      const body = await parseBody(req);
      assert.deepEqual(body, {});
    });

    it('rejects invalid JSON', async () => {
      const req = createReadable('not json');
      await assert.rejects(() => parseBody(req), { message: 'Invalid JSON' });
    });

    it('rejects payload too large', async () => {
      const req = createReadable('x'.repeat(100));
      await assert.rejects(() => parseBody(req, 10), { message: 'Payload too large' });
    });
  });
});
