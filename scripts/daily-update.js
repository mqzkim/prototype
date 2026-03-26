import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collectStats } from './collect-stats.js';

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

function dailyUpdate() {
  const today = getToday();
  const dailyLog = loadJSON('data/daily-log.json');
  const metrics = loadJSON('data/metrics.json');
  const snapshots = loadJSON('data/snapshots.json');

  // Check if today's entry already exists (idempotent)
  const existingEntry = dailyLog.entries.find(e => e.date === today);
  if (existingEntry) {
    console.log(`Entry for ${today} already exists. Skipping.`);
    return;
  }

  // Collect real repo stats
  const stats = collectStats();

  // Determine next version (patch bump)
  const lastEntry = dailyLog.entries[dailyLog.entries.length - 1];
  const [major, minor, patch] = lastEntry.version.split('.').map(Number);
  const nextVersion = `${major}.${minor}.${patch + 1}`;

  // Calculate deltas from previous snapshot
  const prevSnapshot = snapshots.snapshots[snapshots.snapshots.length - 1];
  const delta = {
    commits: stats.commits - (prevSnapshot?.commits || 0),
    lines_of_code: stats.lines_of_code - (prevSnapshot?.lines_of_code || 0),
    total_files: stats.total_files - (prevSnapshot?.total_files || 0),
  };

  // Create today's entry with real data
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

  if (newEntry.changes.length === 0) {
    newEntry.changes = ['Maintenance day - no code changes'];
  }

  dailyLog.entries.push(newEntry);
  saveJSON('data/daily-log.json', dailyLog);

  // Save snapshot
  snapshots.snapshots.push({ date: today, ...stats });
  saveJSON('data/snapshots.json', snapshots);

  // Update metrics
  const lastDate = new Date(metrics.last_updated);
  const todayDate = new Date(today);
  const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  const newStreak = diffDays <= 1 ? metrics.streak + 1 : 1;

  metrics.total_days_active += 1;
  metrics.total_commits = stats.commits;
  metrics.total_lines = stats.lines_of_code;
  metrics.total_files = stats.total_files;
  metrics.last_updated = today;
  metrics.streak = newStreak;
  metrics.service_health = 'healthy';
  saveJSON('data/metrics.json', metrics);

  console.log(`Daily update complete: ${today} (v${nextVersion}, streak: ${newStreak})`);
  console.log(`  Stats: ${stats.commits} commits, ${stats.lines_of_code} LOC, ${stats.total_files} files`);
}

dailyUpdate();
