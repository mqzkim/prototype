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

// ---- Shared helpers for main page ----

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
      <a href="daily/${entry.date}.html" style="text-decoration:none;color:inherit;display:block;">
      <div class="timeline-entry glow-card">
        <div class="entry-header">
          <span class="entry-date">${entry.date}</span>
          <span class="entry-version">v${entry.version}</span>
        </div>
        ${statsHtml}
        <ul class="entry-changes">
          ${entry.changes.map(c => `<li>${c}</li>`).join('\n          ')}
        </ul>
      </div>
      </a>`;
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
          <a href="daily/${s.date}.html" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div class="bar" style="height: ${height}px" title="${s.lines_of_code} LOC on ${s.date}"></div>
          <span class="bar-label">${label}</span>
          </a>
        </div>`;
    })
    .join('\n');
}

function buildQuoteSection(dailyQuote) {
  if (!dailyQuote || !dailyQuote.quote) return '<p class="muted-text">No quote yet</p>';
  return `
    <blockquote class="quote-text">&ldquo;${dailyQuote.quote.text}&rdquo;</blockquote>
    <cite class="quote-author">&mdash; ${dailyQuote.quote.author}</cite>`;
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

function buildVideoLLMSection(research, t) {
  if (!research) return '<p class="muted-text">No research data</p>';

  const genModels = (research.videoGenerationModels || []).slice(0, 5);
  let genHtml = '<div class="video-models-grid">';
  for (const m of genModels) {
    const priceDisplay = typeof m.pricingPerSec === 'string' ? m.pricingPerSec : Object.values(m.pricingPerSec || {})[0] || '—';
    const typeLabel = m.type === 'closed-source' ? `<span class="model-badge closed">${t.closedSource}</span>` : `<span class="model-badge open">${t.openSource}</span>`;
    genHtml += `
      <div class="video-model-card">
        <div class="video-model-header">
          <span class="video-model-name">${m.name}</span>
          ${typeLabel}
        </div>
        <div class="video-model-meta">
          <span class="video-model-res">${m.maxResolution}</span>
          <span class="video-model-price">${priceDisplay}${t.perSec}</span>
        </div>
        <div class="video-model-caps">${(m.strengths || []).slice(0, 2).join(' · ')}</div>
      </div>`;
  }
  genHtml += '</div>';

  const pricing = research.pricingComparison?.models || {};
  const maxPrice = Math.max(...Object.values(pricing), 0.01);
  let pricingHtml = '<div class="pricing-bars">';
  for (const [name, price] of Object.entries(pricing)) {
    const width = Math.max(5, Math.round((price / maxPrice) * 100));
    pricingHtml += `
      <div class="pricing-row">
        <span class="pricing-label">${name}</span>
        <div class="pricing-bar-track">
          <div class="pricing-bar-fill" style="width:${width}%"></div>
        </div>
        <span class="pricing-value">$${price}</span>
      </div>`;
  }
  pricingHtml += '</div>';

  const understandingModels = (research.videoUnderstandingModels || []).slice(0, 3);
  let underHtml = '<div class="understanding-list">';
  for (const m of understandingModels) {
    const benchmark = m.benchmark?.videoMME ? ` | VideoMME: ${m.benchmark.videoMME}%` : '';
    underHtml += `
      <div class="understanding-item">
        <span class="understanding-name">${m.name}</span>
        <span class="understanding-detail">${(m.capabilities || []).slice(0, 3).join(', ')}${benchmark}</span>
      </div>`;
  }
  underHtml += '</div>';

  const opportunities = research.marketAnalysis?.saasOpportunities || [];
  let oppsHtml = '<ul class="saas-opps">';
  for (const opp of opportunities.slice(0, 4)) {
    oppsHtml += `<li>${opp}</li>`;
  }
  oppsHtml += '</ul>';

  return `
    <div class="video-llm-section">
      <div class="video-llm-subsection">
        <h3 class="video-llm-subtitle">${t.videoGenModels}</h3>
        ${genHtml}
      </div>
      <div class="video-llm-subsection">
        <h3 class="video-llm-subtitle">${t.pricingComparison}</h3>
        ${pricingHtml}
      </div>
      <div class="video-llm-subsection">
        <h3 class="video-llm-subtitle">${t.videoUnderstanding}</h3>
        ${underHtml}
      </div>
      <div class="video-llm-subsection">
        <h3 class="video-llm-subtitle">${t.saasOpportunities}</h3>
        ${oppsHtml}
      </div>
    </div>`;
}

function buildSaaSSection(saas) {
  if (!saas || !saas.daily || saas.daily.length === 0) return '<p class="muted-text">Pending first fetch</p>';
  const latest = saas.daily[saas.daily.length - 1];
  if (!latest.products || latest.products.length === 0) return '<p class="muted-text">No data yet</p>';
  return latest.products.slice(0, 5).map((p, i) => `
    <div class="saas-product">
      <span class="saas-rank">#${i + 1}</span>
      <div class="saas-info">
        <span class="saas-name">${p.name}</span>
        <span class="saas-tagline">${p.tagline || ''}</span>
      </div>
      ${p.votes ? `<span class="saas-votes">${p.votes}</span>` : ''}
    </div>`).join('\n');
}

function buildArchiveList(entries) {
  return entries
    .slice()
    .reverse()
    .map(entry => `
      <a href="daily/${entry.date}.html" class="archive-link">
        <span class="archive-date">${entry.date}</span>
        <span class="archive-version">v${entry.version}</span>
        <span class="archive-summary">${entry.changes[0] || ''}</span>
      </a>`)
    .join('\n');
}

// ---- i18n helpers ----

function applyTranslations(html, t) {
  return html.replace(/\{\{t\.(\w+)\}\}/g, (_, key) => t[key] || key);
}

function buildLangSwitcher(locale, locales) {
  return locales
    .filter(l => l !== locale)
    .map(l => `<a href="../${l}/index.html" style="color:var(--cyan);text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:0.75rem;">${l === 'ko' ? '한국어' : 'English'}</a>`)
    .join(' | ');
}

// ---- Daily page section builders ----

function buildDailyQuoteHtml(quotes, date, t) {
  if (!quotes || !quotes.quotes.length) return `<p class="muted-text">${t.noQuote}</p>`;
  const hash = date.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const q = quotes.quotes[Math.abs(hash) % quotes.quotes.length];
  return `<blockquote class="quote-text">&ldquo;${q.text}&rdquo;</blockquote><cite class="quote-author">&mdash; ${q.author}</cite>`;
}

function buildDailyTilHtml(til, date, t) {
  const entry = til?.entries?.find(e => e.date === date);
  if (!entry) return `<p class="muted-text">${t.noTIL}</p>`;
  return `<div class="til-badge">${entry.category}</div><h3 class="til-title">${entry.title}</h3><p class="til-content">${entry.content}</p>`;
}

function buildDailyStatsHtml(snapshots, date, t) {
  const snap = snapshots?.snapshots?.find(s => s.date === date);
  if (!snap) return `<p class="muted-text">${t.noSnapshot}</p>`;
  return `<div class="stats-grid">
    <div class="stat-item"><div class="stat-num">${snap.commits}</div><div class="stat-label">${t.commits}</div></div>
    <div class="stat-item"><div class="stat-num">${snap.lines_of_code}</div><div class="stat-label">LOC</div></div>
    <div class="stat-item"><div class="stat-num">${snap.total_files}</div><div class="stat-label">${t.files}</div></div>
    <div class="stat-item"><div class="stat-num">${snap.repo_size_kb || '—'}KB</div><div class="stat-label">${t.size}</div></div>
  </div>`;
}

function buildDailyApiHtml(apiData, date, t) {
  const exEntry = apiData?.exchange?.history?.find(e => e.date === date);
  const wxEntry = apiData?.weather?.history?.find(e => e.date === date);
  if (!exEntry && !wxEntry) return `<p class="muted-text">${t.noApiData}</p>`;
  let html = '<div class="api-row">';
  if (exEntry) {
    html += `<div class="api-item"><div class="api-label">USD/KRW</div><div class="api-value">${exEntry.usd_krw != null ? exEntry.usd_krw.toLocaleString() : '—'}</div></div>`;
    html += `<div class="api-item"><div class="api-label">USD/JPY</div><div class="api-value">${exEntry.usd_jpy ?? '—'}</div></div>`;
    html += `<div class="api-item"><div class="api-label">USD/EUR</div><div class="api-value">${exEntry.usd_eur ?? '—'}</div></div>`;
  }
  if (wxEntry) {
    html += `<div class="api-item"><div class="api-label">Seoul</div><div class="api-value">${wxEntry.temp_c != null ? wxEntry.temp_c + '°C' : '—'}</div><div class="api-sub">${wxEntry.condition || ''}</div></div>`;
  }
  return html + '</div>';
}

function buildDailyTrendingHtml(trending, date, t) {
  const trendEntry = trending?.daily?.find(d => d.date === date);
  if (!trendEntry?.repos?.length) return `<p class="muted-text">${t.noTrending}</p>`;
  return trendEntry.repos.slice(0, 10).map((r, idx) => `
    <div class="trending-item">
      <span class="trending-rank">#${idx + 1}</span>
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

function buildDailySaaSHtml(saas, date, t) {
  const saasEntry = saas?.daily?.find(d => d.date === date);
  if (!saasEntry?.products?.length) return `<p class="muted-text">${t.noSaaS}</p>`;
  return saasEntry.products.slice(0, 10).map((p, idx) => `
    <div class="saas-item">
      <span class="saas-rank">#${idx + 1}</span>
      <div class="saas-info">
        <span class="saas-name">${p.name}</span>
        <span class="saas-tagline">${p.tagline || ''}</span>
      </div>
      ${p.votes ? `<span class="saas-votes">${p.votes}</span>` : ''}
    </div>`).join('\n');
}

// ---- Page builders ----

function buildMainPage(template, locale, t, data) {
  let html = template
    .replace('{{SERVICE_HEALTH}}', data.metrics.service_health)
    .replace('{{DAYS_ACTIVE}}', String(data.metrics.total_days_active))
    .replace('{{TOTAL_COMMITS}}', String(data.metrics.total_commits))
    .replace('{{TOTAL_LINES}}', String(data.metrics.total_lines))
    .replace('{{TOTAL_FILES}}', String(data.metrics.total_files))
    .replace('{{STREAK}}', String(data.metrics.streak))
    .replace('{{LOC_BARS}}', buildLocBars(data.snapshots?.snapshots))
    .replace('{{QUOTE_SECTION}}', buildQuoteSection(data.dailyQuote))
    .replace('{{TIL_SECTION}}', buildTILSection(data.til))
    .replace('{{TRENDING_SECTION}}', buildTrendingSection(data.trending))
    .replace('{{IMPROVEMENTS_SECTION}}', buildImprovementsSection(data.improvements))
    .replace('{{API_SECTION}}', buildAPISection(data.apiData))
    .replace('{{VIDEO_LLM_SECTION}}', buildVideoLLMSection(data.videoLLM, t))
    .replace('{{SAAS_SECTION}}', buildSaaSSection(data.saas))
    .replace('{{ARCHIVE_LIST}}', buildArchiveList(data.dailyLog.entries))
    .replace('{{TIMELINE_ENTRIES}}', buildTimeline(data.dailyLog.entries))
    .replace('{{LAST_UPDATED}}', data.metrics.last_updated)
    .replace('{{LANG_SWITCHER}}', buildLangSwitcher(locale, data.locales));
  return applyTranslations(html, t);
}

function buildDailyPage(tmpl, entry, nav, data, t) {
  const { date } = entry;
  const changesHtml = entry.changes.length > 0
    ? `<ul class="changes-list">${entry.changes.map(c => `<li>${c}</li>`).join('\n')}</ul>`
    : `<p class="muted-text">${t.noChanges}</p>`;
  let html = tmpl
    .replace(/\{\{DATE\}\}/g, date)
    .replace('{{VERSION}}', `v${entry.version}`)
    .replace('{{NAV_PREV}}', nav.prev)
    .replace('{{NAV_NEXT}}', nav.next)
    .replace('{{QUOTE_HTML}}', buildDailyQuoteHtml(data.quotes, date, t))
    .replace('{{TIL_HTML}}', buildDailyTilHtml(data.til, date, t))
    .replace('{{STATS_HTML}}', buildDailyStatsHtml(data.snapshots, date, t))
    .replace('{{API_HTML}}', buildDailyApiHtml(data.apiData, date, t))
    .replace('{{TRENDING_HTML}}', buildDailyTrendingHtml(data.trending, date, t))
    .replace('{{SAAS_HTML}}', buildDailySaaSHtml(data.saas, date, t))
    .replace('{{CHANGES_HTML}}', changesHtml);
  return applyTranslations(html, t);
}

function buildDailyPages(dailyTemplate, locale, t, data, localeDir) {
  const dailyDir = join(localeDir, 'daily');
  mkdirSync(dailyDir, { recursive: true });
  const dates = data.dailyLog.entries.map(e => e.date);
  for (let i = 0; i < data.dailyLog.entries.length; i++) {
    const entry = data.dailyLog.entries[i];
    const prevDate = i > 0 ? dates[i - 1] : null;
    const nextDate = i < dates.length - 1 ? dates[i + 1] : null;
    const nav = {
      prev: prevDate ? `<a href="${prevDate}.html">&larr; ${prevDate}</a>` : '<span></span>',
      next: nextDate ? `<a href="${nextDate}.html">${nextDate} &rarr;</a>` : '<span></span>',
    };
    const html = buildDailyPage(dailyTemplate, entry, nav, data, t);
    writeFileSync(join(dailyDir, `${entry.date}.html`), html);
  }
}

function buildRedirectPage(locales, distDir) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script>
    const lang = (navigator.language || 'en').slice(0, 2);
    const supported = ${JSON.stringify(locales)};
    const target = supported.includes(lang) ? lang : 'en';
    window.location.replace(target + '/index.html');
  </script>
  <meta http-equiv="refresh" content="0;url=en/index.html">
</head>
<body></body>
</html>`;
  writeFileSync(join(distDir, 'index.html'), html);
}

function copyLandingPage(distDir) {
  const landingPath = join(ROOT, 'src/templates/landing.html');
  if (existsSync(landingPath)) {
    writeFileSync(join(distDir, 'landing.html'), readFileSync(landingPath, 'utf-8'));
    console.log('landing.html generated');
  }
}

// ---- Main build ----

function build() {
  const data = {
    dailyLog: loadJSON('data/daily-log.json'),
    metrics: loadJSON('data/metrics.json'),
    snapshots: loadJSON('data/snapshots.json'),
    dailyQuote: loadJSON('data/daily-quote.json'),
    til: loadJSON('data/til.json'),
    trending: loadJSON('data/trending.json'),
    improvements: loadJSON('data/improvements.json'),
    apiData: loadJSON('data/api-data.json'),
    quotes: loadJSON('data/quotes.json'),
    videoLLM: loadJSON('data/video-llm-research.json'),
    saas: loadJSON('data/saas.json'),
  };
  const i18n = loadJSON('data/i18n.json');
  data.locales = Object.keys(i18n);

  const template = readFileSync(join(ROOT, 'src/templates/index.html'), 'utf-8');
  const dailyTemplate = readFileSync(join(ROOT, 'src/templates/daily.html'), 'utf-8');
  const distDir = join(ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });

  for (const locale of data.locales) {
    const t = i18n[locale];
    const localeDir = join(distDir, locale);
    mkdirSync(localeDir, { recursive: true });
    writeFileSync(join(localeDir, 'index.html'), buildMainPage(template, locale, t, data));
    buildDailyPages(dailyTemplate, locale, t, data, localeDir);
    console.log(`[${locale}] index.html + ${data.dailyLog.entries.length} daily pages`);
  }

  buildRedirectPage(data.locales, distDir);
  copyLandingPage(distDir);
  console.log(`Build complete: ${data.locales.length} locales + redirect`);
}

build();
