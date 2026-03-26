import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const IMPROVEMENTS_PATH = join(ROOT, 'data', 'improvements.json');

const PREFIX_TO_TYPE = {
  'feat:': 'feature',
  'fix:': 'bugfix',
  'refactor:': 'refactor',
  'perf:': 'performance',
  'chore:': 'feature',
  'design:': 'feature',
};

function categorizeCommit(message) {
  const lowerMessage = message.toLowerCase().trim();
  for (const [prefix, type] of Object.entries(PREFIX_TO_TYPE)) {
    if (lowerMessage.startsWith(prefix)) {
      return type;
    }
  }
  return 'feature';
}

function getDescription(message) {
  for (const prefix of Object.keys(PREFIX_TO_TYPE)) {
    if (message.toLowerCase().trim().startsWith(prefix)) {
      return message.slice(prefix.length).trim();
    }
  }
  return message.trim();
}

function getChangedFiles(commitHash) {
  try {
    const output = execSync(
      `git diff-tree --no-commit-id --name-only -r ${commitHash}`,
      { cwd: ROOT, encoding: 'utf-8' }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function getCommitsSince(sinceDate) {
  try {
    const output = execSync(
      `git log --since="${sinceDate}" --format="%H|%ai|%s"`,
      { cwd: ROOT, encoding: 'utf-8' }
    );
    if (!output.trim()) return [];

    return output.trim().split('\n').filter(Boolean).map((line) => {
      const [hash, date, ...messageParts] = line.split('|');
      return {
        hash: hash.trim(),
        date: date.trim().slice(0, 10),
        message: messageParts.join('|').trim(),
      };
    });
  } catch {
    return [];
  }
}

export function logImprovements() {
  const data = JSON.parse(readFileSync(IMPROVEMENTS_PATH, 'utf-8'));

  // Find the last logged date to only process new commits
  const loggedDates = data.entries.map((e) => e.date).sort();
  const lastDate = loggedDates.length > 0 ? loggedDates[loggedDates.length - 1] : '1970-01-01';

  // Collect already-logged commit descriptions to ensure idempotency
  const loggedDescriptions = new Set(data.entries.map((e) => e.description));

  const commits = getCommitsSince(lastDate);

  let newEntries = 0;

  for (const commit of commits) {
    const description = getDescription(commit.message);

    // Skip if already logged (idempotency)
    if (loggedDescriptions.has(description)) {
      continue;
    }

    const type = categorizeCommit(commit.message);
    const filesChanged = getChangedFiles(commit.hash);

    const entry = {
      date: commit.date,
      type,
      description,
      files_changed: filesChanged,
      impact: `Auto-logged from commit ${commit.hash.slice(0, 7)}`,
    };

    data.entries.push(entry);
    loggedDescriptions.add(description);

    // Update stats
    data.stats.total_improvements += 1;
    if (data.stats.by_type[type] !== undefined) {
      data.stats.by_type[type] += 1;
    } else {
      data.stats.by_type[type] = 1;
    }

    newEntries++;
  }

  writeFileSync(IMPROVEMENTS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(`Logged ${newEntries} new improvement(s). Total: ${data.stats.total_improvements}`);
  return data;
}

// Run directly if executed as a script
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  logImprovements();
}
