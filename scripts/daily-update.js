import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

  // Check if today's entry already exists (idempotent)
  const existingEntry = dailyLog.entries.find(e => e.date === today);
  if (existingEntry) {
    console.log(`Entry for ${today} already exists. Skipping.`);
    return;
  }

  // Determine next version (patch bump)
  const lastEntry = dailyLog.entries[dailyLog.entries.length - 1];
  const [major, minor, patch] = lastEntry.version.split('.').map(Number);
  const nextVersion = `${major}.${minor}.${patch + 1}`;

  // Create today's entry
  const newEntry = {
    date: today,
    version: nextVersion,
    changes: [`Daily update for ${today}`],
    metrics: {
      features_added: 0,
      bugs_fixed: 0,
      improvements: 1
    }
  };

  dailyLog.entries.push(newEntry);
  saveJSON('data/daily-log.json', dailyLog);

  // Update metrics
  const lastDate = new Date(metrics.last_updated);
  const todayDate = new Date(today);
  const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  const newStreak = diffDays <= 1 ? metrics.streak + 1 : 1;

  metrics.total_days_active += 1;
  metrics.total_improvements += 1;
  metrics.last_updated = today;
  metrics.streak = newStreak;
  saveJSON('data/metrics.json', metrics);

  console.log(`Daily update complete: ${today} (v${nextVersion}, streak: ${newStreak})`);
}

dailyUpdate();
