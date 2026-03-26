import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

function loadJSON(relativePath) {
  const p = join(ROOT, relativePath);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function buildTimeline(entries) {
  return entries
    .slice()
    .reverse()
    .slice(0, 10)
    .map(entry => {
      const statsHtml = entry.stats ? `
        <div class="entry-stats">
          <span class="entry-stat"><span class="num">${entry.stats.commits}</span> commits</span>
          <span class="entry-stat"><span class="num">${entry.stats.lines_of_code}</span> LOC</span>
          <span class="entry-stat"><span class="num">${entry.stats.total_files}</span> files</span>
        </div>` : '';
      return `
      <div class="timeline-entry glow-card">
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
  if (!snapshots || snapshots.length === 0) return '';
  const maxLoc = Math.max(...snapshots.map(s => s.lines_of_code), 1);
  return snapshots
    .slice(-30)
    .map(s => {
      const height = Math.max(2, Math.round((s.lines_of_code / maxLoc) * 100));
      const label = s.date.slice(5);
      return `
        <div class="bar-group">
          <div class="bar" style="height: ${height}px" title="${s.lines_of_code} LOC on ${s.date}"></div>
          <span class="bar-label">${label}</span>
        </div>`;
    })
    .join('\n');
}

function buildQuoteSection(dailyQuote) {
  if (!dailyQuote || !dailyQuote.quote) return '<p class="muted-text">No quote yet</p>';
  return `
    <blockquote class="quote-text">"${dailyQuote.quote.text}"</blockquote>
    <cite class="quote-author">— ${dailyQuote.quote.author}</cite>`;
}

function buildTILSection(til) {
  if (!til || !til.entries || til.entries.length === 0) return '<p class="muted-text">No TIL yet</p>';
  const latest = til.entries[til.entries.length - 1];
  return `
    <div class="til-badge">${latest.category}</div>
    <h3 class="til-title">${latest.title}</h3>
    <p class="til-content">${latest.content}</p>
    <span class="til-date">${latest.date}</span>`;
}

function buildTrendingSection(trending) {
  if (!trending || !trending.daily || trending.daily.length === 0) return '<p class="muted-text">Pending first fetch</p>';
  const latest = trending.daily[trending.daily.length - 1];
  if (!latest.repos || latest.repos.length === 0) return '<p class="muted-text">No data yet</p>';
  return latest.repos.slice(0, 5).map((r, i) => `
    <div class="trending-repo">
      <span class="trending-rank">#${i + 1}</span>
      <div class="trending-info">
        <span class="trending-name">${r.name}</span>
        <span class="trending-desc">${r.description || ''}</span>
      </div>
      <div class="trending-meta">
        ${r.language ? `<span class="trending-lang">${r.language}</span>` : ''}
        <span class="trending-stars">${r.stars ? r.stars.toLocaleString() : '?'}</span>
      </div>
    </div>`).join('\n');
}

function buildImprovementsSection(improvements) {
  if (!improvements || !improvements.stats) return '';
  const s = improvements.stats;
  return `
    <div class="imp-stat"><span class="num">${s.total_improvements}</span> total</div>
    <div class="imp-stat"><span class="num">${s.by_type.feature || 0}</span> features</div>
    <div class="imp-stat"><span class="num">${s.by_type.refactor || 0}</span> refactors</div>
    <div class="imp-stat"><span class="num">${s.by_type.bugfix || 0}</span> fixes</div>`;
}

function buildAPISection(apiData) {
  if (!apiData) return '<p class="muted-text">Pending first fetch</p>';
  const ex = apiData.exchange?.history;
  const wx = apiData.weather?.history;
  const latestEx = ex && ex.length > 0 ? ex[ex.length - 1] : null;
  const latestWx = wx && wx.length > 0 ? wx[wx.length - 1] : null;

  let html = '<div class="api-grid">';
  if (latestEx) {
    html += `
    <div class="api-card">
      <div class="api-card-title">USD/KRW</div>
      <div class="api-card-value">${latestEx.usd_krw != null ? latestEx.usd_krw.toLocaleString() : '—'}</div>
    </div>
    <div class="api-card">
      <div class="api-card-title">USD/JPY</div>
      <div class="api-card-value">${latestEx.usd_jpy != null ? latestEx.usd_jpy : '—'}</div>
    </div>
    <div class="api-card">
      <div class="api-card-title">USD/EUR</div>
      <div class="api-card-value">${latestEx.usd_eur != null ? latestEx.usd_eur : '—'}</div>
    </div>`;
  }
  if (latestWx) {
    html += `
    <div class="api-card">
      <div class="api-card-title">Seoul</div>
      <div class="api-card-value">${latestWx.temp_c != null ? latestWx.temp_c + '°C' : '—'}</div>
      <div class="api-card-sub">${latestWx.condition || ''}</div>
    </div>`;
  }
  html += '</div>';
  return html;
}

function build() {
  const dailyLog = loadJSON('data/daily-log.json');
  const metrics = loadJSON('data/metrics.json');
  const snapshots = loadJSON('data/snapshots.json');
  const dailyQuote = loadJSON('data/daily-quote.json');
  const til = loadJSON('data/til.json');
  const trending = loadJSON('data/trending.json');
  const improvements = loadJSON('data/improvements.json');
  const apiData = loadJSON('data/api-data.json');

  const template = readFileSync(join(ROOT, 'src/templates/index.html'), 'utf-8');

  const html = template
    .replace('{{SERVICE_HEALTH}}', metrics.service_health)
    .replace('{{DAYS_ACTIVE}}', String(metrics.total_days_active))
    .replace('{{TOTAL_COMMITS}}', String(metrics.total_commits))
    .replace('{{TOTAL_LINES}}', String(metrics.total_lines))
    .replace('{{TOTAL_FILES}}', String(metrics.total_files))
    .replace('{{STREAK}}', String(metrics.streak))
    .replace('{{LOC_BARS}}', buildLocBars(snapshots?.snapshots))
    .replace('{{QUOTE_SECTION}}', buildQuoteSection(dailyQuote))
    .replace('{{TIL_SECTION}}', buildTILSection(til))
    .replace('{{TRENDING_SECTION}}', buildTrendingSection(trending))
    .replace('{{IMPROVEMENTS_SECTION}}', buildImprovementsSection(improvements))
    .replace('{{API_SECTION}}', buildAPISection(apiData))
    .replace('{{TIMELINE_ENTRIES}}', buildTimeline(dailyLog.entries))
    .replace('{{LAST_UPDATED}}', metrics.last_updated);

  const distDir = join(ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, 'index.html'), html);

  console.log(`Build complete: dist/index.html`);
}

build();
