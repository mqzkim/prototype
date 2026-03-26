import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

function loadJSON(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), 'utf-8'));
}

describe('Data file schema validation', () => {
  it('all data/*.json files are valid JSON', () => {
    const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    assert.ok(files.length > 0, 'No JSON files found');
    for (const f of files) {
      assert.doesNotThrow(() => loadJSON(f), `Invalid JSON: ${f}`);
    }
  });

  it('daily-log.json has entries array', () => {
    const data = loadJSON('daily-log.json');
    assert.ok(Array.isArray(data.entries));
    for (const e of data.entries) {
      assert.ok(e.date);
      assert.ok(e.version);
      assert.ok(Array.isArray(e.changes));
    }
  });

  it('metrics.json has required fields', () => {
    const data = loadJSON('metrics.json');
    assert.ok(typeof data.total_days_active === 'number');
    assert.ok(typeof data.total_commits === 'number');
    assert.ok(typeof data.total_lines === 'number');
    assert.ok(typeof data.total_files === 'number');
    assert.ok(typeof data.service_health === 'string');
  });

  it('snapshots.json has snapshots array', () => {
    const data = loadJSON('snapshots.json');
    assert.ok(Array.isArray(data.snapshots));
  });

  it('quotes.json has quotes array', () => {
    const data = loadJSON('quotes.json');
    assert.ok(Array.isArray(data.quotes));
    if (data.quotes.length > 0) {
      assert.ok(data.quotes[0].text);
      assert.ok(data.quotes[0].author);
    }
  });

  it('daily-quote.json has quote object', () => {
    const data = loadJSON('daily-quote.json');
    assert.ok(data.quote || data.date);
  });

  it('til.json has entries array', () => {
    const data = loadJSON('til.json');
    assert.ok(Array.isArray(data.entries));
  });

  it('improvements.json has stats', () => {
    const data = loadJSON('improvements.json');
    assert.ok(data.stats);
    assert.ok(typeof data.stats.total_improvements === 'number');
  });

  it('api-data.json has exchange or weather data', () => {
    const data = loadJSON('api-data.json');
    assert.ok(data.exchange || data.weather);
  });

  it('api-keys.json has keys and tiers', () => {
    const data = loadJSON('api-keys.json');
    assert.ok(Array.isArray(data.keys));
    assert.ok(typeof data.tiers === 'object');
    for (const k of data.keys) {
      assert.ok(k.key);
      assert.ok(k.userId);
      assert.ok(k.tier);
      assert.ok(typeof k.active === 'boolean');
    }
  });

  it('evaluation-scores.json has evaluations array', () => {
    const data = loadJSON('evaluation-scores.json');
    assert.ok(Array.isArray(data.evaluations));
    if (data.evaluations.length > 0) {
      const e = data.evaluations[0];
      assert.ok(e.date);
      assert.ok(typeof e.totalScore === 'number');
      assert.ok(typeof e.maxScore === 'number');
    }
  });

  it('i18n.json has locale objects', () => {
    const data = loadJSON('i18n.json');
    assert.ok(data.en);
    assert.ok(data.ko);
  });

  it('trending.json has daily array', () => {
    const data = loadJSON('trending.json');
    assert.ok(Array.isArray(data.daily));
  });

  it('usage-log.json has records array', () => {
    const data = loadJSON('usage-log.json');
    assert.ok(Array.isArray(data.records));
  });

  it('video-llm-research.json has model data', () => {
    const data = loadJSON('video-llm-research.json');
    assert.ok(data.videoGenerationModels || data.videoUnderstandingModels);
  });

  it('video-llm-cost-plan.json has metadata', () => {
    const data = loadJSON('video-llm-cost-plan.json');
    assert.ok(data.metadata);
    assert.ok(data.metadata.title);
  });

  it('saas.json is valid JSON', () => {
    const data = loadJSON('saas.json');
    assert.ok(typeof data === 'object');
  });
});
