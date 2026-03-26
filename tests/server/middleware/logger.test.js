import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { logger } from '../../../src/server/middleware/logger.js';

describe('Logger middleware', () => {
  it('sets req._startTime', () => {
    const req = { method: 'GET', url: '/v1/health' };
    const res = { end: () => {}, statusCode: 200 };
    logger(req, res);
    assert.ok(typeof req._startTime === 'number');
    assert.ok(req._startTime <= Date.now());
  });

  it('wraps res.end to log output', () => {
    const req = { method: 'GET', url: '/test' };
    let logged = '';
    const origWrite = process.stdout.write;
    process.stdout.write = (s) => { logged += s; return true; };

    const res = {
      statusCode: 200,
      end(...args) { return args; },
    };
    logger(req, res);
    res.end('done');

    process.stdout.write = origWrite;
    assert.ok(logged.includes('[api]'));
    assert.ok(logged.includes('GET'));
    assert.ok(logged.includes('/test'));
    assert.ok(logged.includes('200'));
    assert.ok(logged.includes('ms'));
  });

  it('calls original res.end and returns its result', () => {
    const req = { method: 'POST', url: '/v1/generate' };
    let endCalled = false;
    const origWrite = process.stdout.write;
    process.stdout.write = () => true;

    const res = {
      statusCode: 201,
      end() { endCalled = true; },
    };
    logger(req, res);
    res.end('body');

    process.stdout.write = origWrite;
    assert.equal(endCalled, true);
  });
});
