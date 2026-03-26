import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('data files', () => {
  it('daily-log.json is valid', () => {
    const data = JSON.parse(readFileSync(join(ROOT, 'data/daily-log.json'), 'utf-8'));
    assert.ok(Array.isArray(data.entries));
    assert.ok(data.entries.length > 0);
    for (const entry of data.entries) {
      assert.ok(entry.date);
      assert.ok(entry.version);
      assert.ok(Array.isArray(entry.changes));
    }
  });

  it('metrics.json is valid', () => {
    const data = JSON.parse(readFileSync(join(ROOT, 'data/metrics.json'), 'utf-8'));
    assert.ok(typeof data.total_days_active === 'number');
    assert.ok(typeof data.total_commits === 'number');
    assert.ok(typeof data.total_lines === 'number');
    assert.ok(typeof data.streak === 'number');
    assert.ok(data.last_updated);
    assert.ok(data.service_health);
  });

  it('snapshots.json is valid', () => {
    const data = JSON.parse(readFileSync(join(ROOT, 'data/snapshots.json'), 'utf-8'));
    assert.ok(Array.isArray(data.snapshots));
    assert.ok(data.snapshots.length > 0);
    for (const snap of data.snapshots) {
      assert.ok(snap.date);
      assert.ok(typeof snap.lines_of_code === 'number');
      assert.ok(typeof snap.commits === 'number');
    }
  });
});

describe('build', () => {
  it('generates dist/index.html', () => {
    execSync('node src/generators/build.js', { cwd: ROOT });
    assert.ok(existsSync(join(ROOT, 'dist/index.html')));
  });

  it('dist/index.html contains dashboard elements', () => {
    const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf-8');
    assert.ok(html.includes('Build in Public'));
    assert.ok(html.includes('Days Active'));
    assert.ok(html.includes('Commits'));
    assert.ok(html.includes('Lines of Code'));
    assert.ok(html.includes('2026-03-26'));
    assert.ok(html.includes('bar-chart'));
  });
});
