import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

function loadJSON(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf-8'));
}

function buildTimeline(entries) {
  return entries
    .slice()
    .reverse()
    .map(entry => `
      <div class="day-entry">
        <div class="day-header">
          <span class="day-date">${entry.date}</span>
          <span class="day-version">v${entry.version}</span>
        </div>
        <ul class="day-changes">
          ${entry.changes.map(c => `<li>${c}</li>`).join('\n          ')}
        </ul>
      </div>`)
    .join('\n');
}

function build() {
  const dailyLog = loadJSON('data/daily-log.json');
  const metrics = loadJSON('data/metrics.json');
  const template = readFileSync(join(ROOT, 'src/templates/index.html'), 'utf-8');

  const html = template
    .replace('{{SERVICE_HEALTH}}', metrics.service_health)
    .replace('{{DAYS_ACTIVE}}', String(metrics.total_days_active))
    .replace('{{TOTAL_FEATURES}}', String(metrics.total_features))
    .replace('{{BUGS_FIXED}}', String(metrics.total_bugs_fixed))
    .replace('{{STREAK}}', String(metrics.streak))
    .replace('{{TIMELINE_ENTRIES}}', buildTimeline(dailyLog.entries))
    .replace('{{LAST_UPDATED}}', metrics.last_updated);

  const distDir = join(ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, 'index.html'), html);

  console.log(`Build complete: dist/index.html (${dailyLog.entries.length} entries)`);
}

build();
