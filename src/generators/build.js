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
    .map(entry => {
      const statsHtml = entry.stats ? `
        <div class="entry-stats">
          <span class="entry-stat"><span class="num">${entry.stats.commits}</span> commits</span>
          <span class="entry-stat"><span class="num">${entry.stats.lines_of_code}</span> LOC</span>
          <span class="entry-stat"><span class="num">${entry.stats.total_files}</span> files</span>
        </div>` : '';

      return `
      <div class="timeline-entry">
        <div class="entry-header">
          <span class="entry-date">${entry.date}</span>
          <span class="entry-version">v${entry.version}</span>
        </div>
        ${statsHtml}
        <ul class="entry-changes">
          ${entry.changes.map(c => `<li>${c}</li>`).join('\n          ')}
        </ul>
      </div>`;
    })
    .join('\n');
}

function buildLocBars(snapshots) {
  if (snapshots.length === 0) return '';
  const maxLoc = Math.max(...snapshots.map(s => s.lines_of_code), 1);

  return snapshots
    .slice(-30) // last 30 days
    .map(s => {
      const height = Math.max(2, Math.round((s.lines_of_code / maxLoc) * 100));
      const label = s.date.slice(5); // MM-DD
      return `
        <div class="bar-group">
          <div class="bar" style="height: ${height}px" title="${s.lines_of_code} LOC on ${s.date}"></div>
          <span class="bar-label">${label}</span>
        </div>`;
    })
    .join('\n');
}

function build() {
  const dailyLog = loadJSON('data/daily-log.json');
  const metrics = loadJSON('data/metrics.json');
  const snapshots = loadJSON('data/snapshots.json');
  const template = readFileSync(join(ROOT, 'src/templates/index.html'), 'utf-8');

  const html = template
    .replace('{{SERVICE_HEALTH}}', metrics.service_health)
    .replace('{{DAYS_ACTIVE}}', String(metrics.total_days_active))
    .replace('{{TOTAL_COMMITS}}', String(metrics.total_commits))
    .replace('{{TOTAL_LINES}}', String(metrics.total_lines))
    .replace('{{TOTAL_FILES}}', String(metrics.total_files))
    .replace('{{STREAK}}', String(metrics.streak))
    .replace('{{LOC_BARS}}', buildLocBars(snapshots.snapshots))
    .replace('{{TIMELINE_ENTRIES}}', buildTimeline(dailyLog.entries))
    .replace('{{LAST_UPDATED}}', metrics.last_updated);

  const distDir = join(ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, 'index.html'), html);

  console.log(`Build complete: dist/index.html`);
  console.log(`  ${dailyLog.entries.length} changelog entries, ${snapshots.snapshots.length} snapshots`);
}

build();
