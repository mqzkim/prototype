import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectStats } from './collect-stats.js';
import { selectDailyQuote } from './select-quote.js';
import { generateTIL } from './generate-til.js';
import { fetchTrending } from './fetch-trending.js';
import { logImprovements } from './log-improvement.js';
import { fetchAPIs } from './fetch-apis.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadJSON(relativePath) {
  const raw = readFileSync(join(ROOT, relativePath), 'utf-8');
  return JSON.parse(raw);
}

function saveJSON(relativePath, data) {
  writeFileSync(join(ROOT, relativePath), JSON.stringify(data, null, 2) + '\n');
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

async function dailyUpdate() {
  const today = getToday();
  console.log(`=== Daily Update: ${today} ===\n`);

  // 1. Core: changelog + stats
  const dailyLog = loadJSON('data/daily-log.json');
  const metrics = loadJSON('data/metrics.json');
  const snapshots = loadJSON('data/snapshots.json');

  const existingEntry = dailyLog.entries.find(e => e.date === today);
  if (!existingEntry) {
    const stats = collectStats();
    const lastEntry = dailyLog.entries[dailyLog.entries.length - 1];
    const [major, minor, patch] = lastEntry.version.split('.').map(Number);
    const nextVersion = `${major}.${minor}.${patch + 1}`;

    const prevSnapshot = snapshots.snapshots[snapshots.snapshots.length - 1];
    const delta = {
      commits: stats.commits - (prevSnapshot?.commits || 0),
      lines_of_code: stats.lines_of_code - (prevSnapshot?.lines_of_code || 0),
      total_files: stats.total_files - (prevSnapshot?.total_files || 0),
    };

    const newEntry = {
      date: today,
      version: nextVersion,
      changes: [
        delta.commits > 0 ? `+${delta.commits} commits` : null,
        delta.lines_of_code !== 0 ? `${delta.lines_of_code > 0 ? '+' : ''}${delta.lines_of_code} lines of code` : null,
        delta.total_files !== 0 ? `${delta.total_files > 0 ? '+' : ''}${delta.total_files} files` : null,
      ].filter(Boolean),
      stats
    };
    if (newEntry.changes.length === 0) newEntry.changes = ['Maintenance day'];

    dailyLog.entries.push(newEntry);
    saveJSON('data/daily-log.json', dailyLog);
    snapshots.snapshots.push({ date: today, ...stats });
    saveJSON('data/snapshots.json', snapshots);

    const lastDate = new Date(metrics.last_updated);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    metrics.streak = diffDays <= 1 ? metrics.streak + 1 : 1;
    metrics.total_days_active += 1;
    metrics.total_commits = stats.commits;
    metrics.total_lines = stats.lines_of_code;
    metrics.total_files = stats.total_files;
    metrics.last_updated = today;
    metrics.service_health = 'healthy';
    saveJSON('data/metrics.json', metrics);

    console.log(`[changelog] v${nextVersion}, streak: ${metrics.streak}`);
  } else {
    console.log('[changelog] Already exists, skipping');
  }

  // 2. Dev Quote of the Day
  try { selectDailyQuote(); console.log('[quote] Selected'); }
  catch (e) { console.warn('[quote] Failed:', e.message); }

  // 3. TIL
  try { generateTIL(); console.log('[til] Generated'); }
  catch (e) { console.warn('[til] Failed:', e.message); }

  // 4. GitHub Trending
  try { await fetchTrending(); console.log('[trending] Fetched'); }
  catch (e) { console.warn('[trending] Failed:', e.message); }

  // 5. Log Improvements
  try { logImprovements(); console.log('[improvements] Logged'); }
  catch (e) { console.warn('[improvements] Failed:', e.message); }

  // 6. Public API Data
  try { await fetchAPIs(); console.log('[api-data] Fetched'); }
  catch (e) { console.warn('[api-data] Failed:', e.message); }

  console.log('\n=== Daily Update Complete ===');
}

dailyUpdate();
