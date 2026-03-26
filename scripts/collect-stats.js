import { execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();

function countLines(dir, extensions) {
  let total = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isDirectory()) {
      total += countLines(fullPath, extensions);
    } else if (extensions.includes(extname(entry.name))) {
      const content = readFileSync(fullPath, 'utf-8');
      total += content.split('\n').filter(line => line.trim().length > 0).length;
    }
  }
  return total;
}

function countFiles(dir, extensions) {
  let total = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isDirectory()) {
      total += countFiles(fullPath, extensions);
    } else if (extensions.includes(extname(entry.name))) {
      total++;
    }
  }
  return total;
}

export function collectStats() {
  const codeExts = ['.js', '.ts', '.html', '.css', '.json', '.md', '.yml', '.yaml', '.sh'];

  const commitCount = parseInt(
    execSync('git rev-list --count HEAD 2>/dev/null || echo 0', { encoding: 'utf-8' }).trim()
  );

  const branchCount = parseInt(
    execSync('git branch -a 2>/dev/null | wc -l', { encoding: 'utf-8' }).trim()
  );

  const firstCommitDate = execSync(
    'git log --reverse --format=%aI 2>/dev/null | head -1 || echo ""',
    { encoding: 'utf-8' }
  ).trim();

  const linesOfCode = countLines(ROOT, ['.js', '.ts', '.html', '.css']);
  const totalFiles = countFiles(ROOT, codeExts);
  const jsonDataFiles = countFiles(join(ROOT, 'data'), ['.json']);

  const repoSizeKB = Math.round(
    parseInt(execSync(`du -sk "${ROOT}" --exclude=node_modules --exclude=.git 2>/dev/null | cut -f1`, { encoding: 'utf-8' }).trim())
  );

  return {
    collected_at: new Date().toISOString(),
    commits: commitCount,
    branches: branchCount,
    lines_of_code: linesOfCode,
    total_files: totalFiles,
    data_files: jsonDataFiles,
    repo_size_kb: repoSizeKB,
    project_age_days: firstCommitDate
      ? Math.ceil((Date.now() - new Date(firstCommitDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0
  };
}

// Run directly
if (process.argv[1] && process.argv[1].includes('collect-stats')) {
  console.log(JSON.stringify(collectStats(), null, 2));
}
