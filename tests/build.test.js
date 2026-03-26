import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadJSON(name) {
  return JSON.parse(readFileSync(join(ROOT, 'data', name), 'utf-8'));
}

describe('data files', () => {
  it('daily-log.json is valid', () => {
    const data = loadJSON('daily-log.json');
    assert.ok(Array.isArray(data.entries));
    assert.ok(data.entries.length > 0);
    for (const entry of data.entries) {
      assert.ok(entry.date);
      assert.ok(entry.version);
      assert.ok(Array.isArray(entry.changes));
    }
  });

  it('metrics.json is valid', () => {
    const data = loadJSON('metrics.json');
    assert.ok(typeof data.total_days_active === 'number');
    assert.ok(typeof data.total_commits === 'number');
    assert.ok(typeof data.total_lines === 'number');
    assert.ok(typeof data.streak === 'number');
    assert.ok(data.last_updated);
    assert.ok(data.service_health);
  });

  it('snapshots.json is valid', () => {
    const data = loadJSON('snapshots.json');
    assert.ok(Array.isArray(data.snapshots));
    assert.ok(data.snapshots.length > 0);
  });

  it('quotes.json has entries', () => {
    const data = loadJSON('quotes.json');
    assert.ok(Array.isArray(data.quotes));
    assert.ok(data.quotes.length >= 50);
  });

  it('daily-quote.json is valid', () => {
    const data = loadJSON('daily-quote.json');
    assert.ok(data.date);
    assert.ok(data.quote.text);
    assert.ok(data.quote.author);
  });

  it('til.json has entries', () => {
    const data = loadJSON('til.json');
    assert.ok(Array.isArray(data.entries));
    assert.ok(data.entries.length > 0);
  });

  it('improvements.json is valid', () => {
    const data = loadJSON('improvements.json');
    assert.ok(Array.isArray(data.entries));
    assert.ok(data.stats);
    assert.ok(typeof data.stats.total_improvements === 'number');
  });

  it('saas.json is valid', () => {
    const data = loadJSON('saas.json');
    assert.ok(Array.isArray(data.daily));
  });
});

describe('build', () => {
  it('generates locale pages', () => {
    execSync('node src/generators/build.js', { cwd: ROOT });
    assert.ok(existsSync(join(ROOT, 'dist/index.html')));
    assert.ok(existsSync(join(ROOT, 'dist/en/index.html')));
    assert.ok(existsSync(join(ROOT, 'dist/ko/index.html')));
  });

  it('root index.html redirects by language', () => {
    const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf-8');
    assert.ok(html.includes('navigator.language'));
    assert.ok(html.includes('en/index.html'));
  });

  it('English page contains all sections', () => {
    const html = readFileSync(join(ROOT, 'dist/en/index.html'), 'utf-8');
    assert.ok(html.includes('Build in Public'));
    assert.ok(html.includes('Days Active'));
    assert.ok(html.includes('Quote of the Day'));
    assert.ok(html.includes('Today I Learned'));
    assert.ok(html.includes('GitHub Trending'));
    assert.ok(html.includes('Auto Improvements'));
    assert.ok(html.includes('Live Data'));
    assert.ok(html.includes('Indie SaaS'));
    assert.ok(html.includes('Changelog'));
    assert.ok(html.includes('lang="en"'));
  });

  it('Korean page contains translated labels', () => {
    const html = readFileSync(join(ROOT, 'dist/ko/index.html'), 'utf-8');
    assert.ok(html.includes('lang="ko"'));
    assert.ok(html.includes('활동일 수'));
    assert.ok(html.includes('오늘의 명언'));
    assert.ok(html.includes('오늘 배운 것'));
    assert.ok(html.includes('일별 아카이브'));
  });

  it('generates daily pages per locale', () => {
    assert.ok(existsSync(join(ROOT, 'dist/en/daily/2026-03-26.html')));
    assert.ok(existsSync(join(ROOT, 'dist/ko/daily/2026-03-26.html')));
  });
});
