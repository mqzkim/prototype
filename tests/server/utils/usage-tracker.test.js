import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { UsageTracker } from '../../../src/server/utils/usage-tracker.js';

const TMP_DIR = join(import.meta.dirname || '.', '..', '..', '..', '.tmp-usage-test');

describe('UsageTracker', () => {
  beforeEach(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(join(TMP_DIR, 'usage-log.json'), JSON.stringify({ records: [] }));
  });

  it('records a usage event', async () => {
    const tracker = new UsageTracker(TMP_DIR);
    await tracker.record({
      apiKey: 'test-key',
      endpoint: '/v1/generate',
      status: 'success',
      durationMs: 50,
    });
    // Wait for write queue
    await tracker._writeQueue;
    const records = await tracker.getUsage('test-key');
    assert.equal(records.length, 1);
    assert.equal(records[0].endpoint, '/v1/generate');
    assert.ok(records[0].timestamp);
  });

  it('getUsage filters by apiKey', async () => {
    const tracker = new UsageTracker(TMP_DIR);
    await tracker.record({ apiKey: 'a', endpoint: '/v1/generate', status: 'success', durationMs: 1 });
    await tracker.record({ apiKey: 'b', endpoint: '/v1/analyze', status: 'success', durationMs: 2 });
    await tracker._writeQueue;
    const records = await tracker.getUsage('a');
    assert.equal(records.length, 1);
    assert.equal(records[0].apiKey, 'a');
  });

  it('getUsage filters by date range', async () => {
    const tracker = new UsageTracker(TMP_DIR);
    await tracker.record({ apiKey: 'r', endpoint: '/test', status: 'success', durationMs: 1 });
    await tracker._writeQueue;
    const future = await tracker.getUsage('r', { from: '2099-01-01' });
    assert.equal(future.length, 0);
  });

  it('getAggregated returns summary', async () => {
    const tracker = new UsageTracker(TMP_DIR);
    await tracker.record({ apiKey: 'agg', endpoint: '/v1/generate', estimatedCost: 0.5, status: 'success', durationMs: 1 });
    await tracker.record({ apiKey: 'agg', endpoint: '/v1/generate', estimatedCost: 0.3, status: 'success', durationMs: 1 });
    await tracker._writeQueue;
    const agg = await tracker.getAggregated('agg');
    assert.equal(agg.totalRequests, 2);
    assert.ok(Math.abs(agg.totalCost - 0.8) < 0.001);
    assert.equal(agg.byEndpoint['/v1/generate'], 2);
  });

  it('handles missing file gracefully', async () => {
    rmSync(TMP_DIR, { recursive: true, force: true });
    mkdirSync(TMP_DIR, { recursive: true });
    const tracker = new UsageTracker(TMP_DIR);
    const records = await tracker.getUsage('none');
    assert.deepEqual(records, []);
  });

  // Cleanup
  it('cleanup tmp dir', () => {
    rmSync(TMP_DIR, { recursive: true, force: true });
  });
});
