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

  // Generation models table
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

  // Pricing chart bars
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

  // Understanding models
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

  // SaaS opportunities
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

// ---- Main build ----

function build() {
  const dailyLog = loadJSON('data/daily-log.json');
  const metrics = loadJSON('data/metrics.json');
  const snapshots = loadJSON('data/snapshots.json');
  const dailyQuote = loadJSON('data/daily-quote.json');
  const til = loadJSON('data/til.json');
  const trending = loadJSON('data/trending.json');
  const improvements = loadJSON('data/improvements.json');
  const apiData = loadJSON('data/api-data.json');
  const quotes = loadJSON('data/quotes.json');
  const videoLLM = loadJSON('data/video-llm-research.json');
  const saas = loadJSON('data/saas.json');
  const i18n = loadJSON('data/i18n.json');

  const template = readFileSync(join(ROOT, 'src/templates/index.html'), 'utf-8');
  const dailyTemplate = readFileSync(join(ROOT, 'src/templates/daily.html'), 'utf-8');
  const locales = Object.keys(i18n);
  const distDir = join(ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });

  for (const locale of locales) {
    const t = i18n[locale];
    const localeDir = join(distDir, locale);
    mkdirSync(localeDir, { recursive: true });

    // Build main page for this locale
    let html = template
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
      .replace('{{VIDEO_LLM_SECTION}}', buildVideoLLMSection(videoLLM, t))
      .replace('{{SAAS_SECTION}}', buildSaaSSection(saas))
      .replace('{{ARCHIVE_LIST}}', buildArchiveList(dailyLog.entries))
      .replace('{{TIMELINE_ENTRIES}}', buildTimeline(dailyLog.entries))
      .replace('{{LAST_UPDATED}}', metrics.last_updated)
      .replace('{{LANG_SWITCHER}}', buildLangSwitcher(locale, locales));
    html = applyTranslations(html, t);

    writeFileSync(join(localeDir, 'index.html'), html);

    // Build daily pages for this locale
    const dailyDir = join(localeDir, 'daily');
    mkdirSync(dailyDir, { recursive: true });
    const dates = dailyLog.entries.map(e => e.date);

    for (let i = 0; i < dailyLog.entries.length; i++) {
      const entry = dailyLog.entries[i];
      const date = entry.date;
      const prevDate = i > 0 ? dates[i - 1] : null;
      const nextDate = i < dates.length - 1 ? dates[i + 1] : null;
      const navPrev = prevDate ? `<a href="${prevDate}.html">&larr; ${prevDate}</a>` : '<span></span>';
      const navNext = nextDate ? `<a href="${nextDate}.html">${nextDate} &rarr;</a>` : '<span></span>';

      let quoteHtml = `<p class="muted-text">${t.noQuote}</p>`;
      if (quotes && quotes.quotes.length > 0) {
        const hash = date.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
        const idx = Math.abs(hash) % quotes.quotes.length;
        const q = quotes.quotes[idx];
        quoteHtml = `<blockquote class="quote-text">&ldquo;${q.text}&rdquo;</blockquote><cite class="quote-author">&mdash; ${q.author}</cite>`;
      }

      let tilHtml = `<p class="muted-text">${t.noTIL}</p>`;
      const tilEntry = til?.entries?.find(e => e.date === date);
      if (tilEntry) {
        tilHtml = `<div class="til-badge">${tilEntry.category}</div><h3 class="til-title">${tilEntry.title}</h3><p class="til-content">${tilEntry.content}</p>`;
      }

      let statsHtml = `<p class="muted-text">${t.noSnapshot}</p>`;
      const snap = snapshots?.snapshots?.find(s => s.date === date);
      if (snap) {
        statsHtml = `<div class="stats-grid">
          <div class="stat-item"><div class="stat-num">${snap.commits}</div><div class="stat-label">${t.commits}</div></div>
          <div class="stat-item"><div class="stat-num">${snap.lines_of_code}</div><div class="stat-label">LOC</div></div>
          <div class="stat-item"><div class="stat-num">${snap.total_files}</div><div class="stat-label">${t.files}</div></div>
          <div class="stat-item"><div class="stat-num">${snap.repo_size_kb || '—'}KB</div><div class="stat-label">${t.size}</div></div>
        </div>`;
      }

      let apiHtml = `<p class="muted-text">${t.noApiData}</p>`;
      const exEntry = apiData?.exchange?.history?.find(e => e.date === date);
      const wxEntry = apiData?.weather?.history?.find(e => e.date === date);
      if (exEntry || wxEntry) {
        apiHtml = '<div class="api-row">';
        if (exEntry) {
          apiHtml += `
            <div class="api-item"><div class="api-label">USD/KRW</div><div class="api-value">${exEntry.usd_krw != null ? exEntry.usd_krw.toLocaleString() : '—'}</div></div>
            <div class="api-item"><div class="api-label">USD/JPY</div><div class="api-value">${exEntry.usd_jpy ?? '—'}</div></div>
            <div class="api-item"><div class="api-label">USD/EUR</div><div class="api-value">${exEntry.usd_eur ?? '—'}</div></div>`;
        }
        if (wxEntry) {
          apiHtml += `<div class="api-item"><div class="api-label">Seoul</div><div class="api-value">${wxEntry.temp_c != null ? wxEntry.temp_c + '°C' : '—'}</div><div class="api-sub">${wxEntry.condition || ''}</div></div>`;
        }
        apiHtml += '</div>';
      }

      let trendingHtml = `<p class="muted-text">${t.noTrending}</p>`;
      const trendEntry = trending?.daily?.find(d => d.date === date);
      if (trendEntry?.repos?.length > 0) {
        trendingHtml = trendEntry.repos.slice(0, 10).map((r, idx) => `
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

      let saasHtml = `<p class="muted-text">${t.noSaaS}</p>`;
      const saasEntry = saas?.daily?.find(d => d.date === date);
      if (saasEntry?.products?.length > 0) {
        saasHtml = saasEntry.products.slice(0, 10).map((p, idx) => `
          <div class="saas-item">
            <span class="saas-rank">#${idx + 1}</span>
            <div class="saas-info">
              <span class="saas-name">${p.name}</span>
              <span class="saas-tagline">${p.tagline || ''}</span>
            </div>
            ${p.votes ? `<span class="saas-votes">${p.votes}</span>` : ''}
          </div>`).join('\n');
      }

      const changesHtml = entry.changes.length > 0
        ? `<ul class="changes-list">${entry.changes.map(c => `<li>${c}</li>`).join('\n')}</ul>`
        : `<p class="muted-text">${t.noChanges}</p>`;

      let dayHtml = dailyTemplate
        .replace(/\{\{DATE\}\}/g, date)
        .replace('{{VERSION}}', `v${entry.version}`)
        .replace('{{NAV_PREV}}', navPrev)
        .replace('{{NAV_NEXT}}', navNext)
        .replace('{{QUOTE_HTML}}', quoteHtml)
        .replace('{{TIL_HTML}}', tilHtml)
        .replace('{{STATS_HTML}}', statsHtml)
        .replace('{{API_HTML}}', apiHtml)
        .replace('{{TRENDING_HTML}}', trendingHtml)
        .replace('{{SAAS_HTML}}', saasHtml)
        .replace('{{CHANGES_HTML}}', changesHtml);
      dayHtml = applyTranslations(dayHtml, t);

      writeFileSync(join(dailyDir, `${date}.html`), dayHtml);
    }

    console.log(`[${locale}] index.html + ${dailyLog.entries.length} daily pages`);
  }

  // Root redirect page
  const redirectHtml = `<!DOCTYPE html>
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
  writeFileSync(join(distDir, 'index.html'), redirectHtml);

  console.log(`Build complete: ${locales.length} locales + redirect`);
}

build();
