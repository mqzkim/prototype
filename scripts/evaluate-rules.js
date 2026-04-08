/**
 * RULES.md Evaluation Engine
 * Scores the codebase against fixed, quantifiable criteria.
 * Writes results to data/evaluation-scores.json.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Parse the JSON schema block from RULES.md
 * @returns {object}
 */
function loadRulesSchema() {
  const rulesPath = join(ROOT, 'RULES.md');
  if (!existsSync(rulesPath)) {
    return null;
  }
  const md = readFileSync(rulesPath, 'utf-8');
  const match = md.match(/```json\r?\n([\s\S]*?)\r?\n```/);
  if (!match) throw new Error('No JSON schema found in RULES.md');
  return JSON.parse(match[1]);
}

/**
 * Find all .js files in a directory recursively
 * @param {string} dir
 * @returns {string[]}
 */
function findJS(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...findJS(full));
    else if (entry.endsWith('.js')) results.push(full);
  }
  return results;
}

/**
 * Count regex pattern violations in files
 * @param {string} pattern
 * @param {string} globDir
 * @returns {number}
 */
function countViolations(pattern, globDir) {
  const dir = join(ROOT, globDir.split('/**')[0]);
  const files = findJS(dir);
  const re = new RegExp(pattern, 'g');
  let count = 0;
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (re.test(line)) count++;
      re.lastIndex = 0;
    }
  }
  return count;
}

/**
 * Count functions that have JSDoc above them
 * @param {string} globDir
 * @returns {{ total: number, documented: number }}
 */
function countJSDocRatio(globDir) {
  const dir = join(ROOT, globDir.split('/**')[0]);
  const files = findJS(dir);
  let total = 0;
  let documented = 0;
  for (const f of files) {
    const lines = readFileSync(f, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('export function') || line.startsWith('export async function')) {
        total++;
        let j = i - 1;
        while (j >= 0 && lines[j].trim() === '') j--;
        if (j >= 0 && lines[j].trim().endsWith('*/')) documented++;
      }
    }
  }
  return { total: total || 1, documented };
}

/**
 * Count functions longer than maxLines
 * @param {string} globDir
 * @param {number} maxLines
 * @returns {{ total: number, conforming: number }}
 */
function countFunctionLengths(globDir, maxLines = 40) {
  const dir = join(ROOT, globDir.split('/**')[0]);
  const files = findJS(dir);
  let total = 0;
  let conforming = 0;
  for (const f of files) {
    const lines = readFileSync(f, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.match(/^(export\s+)?(async\s+)?function\s/)) {
        total++;
        let depth = 0;
        let started = false;
        let fnLen = 0;
        for (let j = i; j < lines.length; j++) {
          fnLen++;
          for (const ch of lines[j]) {
            if (ch === '{') { depth++; started = true; }
            if (ch === '}') depth--;
          }
          if (started && depth === 0) break;
        }
        if (fnLen <= maxLines) conforming++;
      }
    }
  }
  return { total: total || 1, conforming };
}

/**
 * Run all tests and check if they pass
 * @returns {boolean}
 */
function allTestsPass() {
  try {
    execSync('npm test', { cwd: ROOT, stdio: 'pipe', timeout: 60000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Count test files and source files
 * @returns {{ testFiles: number, srcFiles: number }}
 */
function countFileCoverage() {
  const testFiles = findJS(join(ROOT, 'tests')).length;
  const srcFiles = findJS(join(ROOT, 'src')).length;
  return { testFiles, srcFiles: srcFiles || 1 };
}

/**
 * Check if integration tests exist
 * @returns {number}
 */
function countIntegrationTests() {
  const testFiles = findJS(join(ROOT, 'tests'));
  return testFiles.filter((f) => f.includes('integration')).length;
}

/**
 * Count average assert calls per test file
 * @returns {number}
 */
function avgAssertionsPerFile() {
  const testFiles = findJS(join(ROOT, 'tests'));
  if (testFiles.length === 0) return 0;
  let totalAsserts = 0;
  for (const f of testFiles) {
    const content = readFileSync(f, 'utf-8');
    const matches = content.match(/assert\./g);
    totalAsserts += matches ? matches.length : 0;
  }
  return totalAsserts / testFiles.length;
}

/**
 * Check route test coverage
 * @returns {{ total: number, covered: number }}
 */
function routeTestCoverage() {
  const routeDir = join(ROOT, 'src', 'server', 'routes');
  if (!existsSync(routeDir)) return { total: 0, covered: 0 };
  const routeFiles = readdirSync(routeDir).filter((f) => f.endsWith('.js'));
  const testDir = join(ROOT, 'tests', 'server');
  const testContent = existsSync(testDir)
    ? findJS(testDir).map((f) => readFileSync(f, 'utf-8')).join('\n')
    : '';
  let covered = 0;
  for (const rf of routeFiles) {
    const name = rf.replace('.js', '');
    if (testContent.includes(name) || testContent.includes(`/${name}`)) covered++;
  }
  return { total: routeFiles.length || 1, covered };
}

/**
 * Check if a file contains a string
 * @param {string} relPath
 * @param {string[]} strings
 * @returns {boolean}
 */
function fileContains(relPath, strings) {
  const fullPath = join(ROOT, relPath);
  if (!existsSync(fullPath)) return false;
  const content = readFileSync(fullPath, 'utf-8');
  return strings.every((s) => content.includes(s));
}

/**
 * Check data file test coverage
 * @returns {{ total: number, covered: number }}
 */
function dataFileTestCoverage() {
  const dataDir = join(ROOT, 'data');
  const dataFiles = readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  const testContent = findJS(join(ROOT, 'tests')).map((f) => readFileSync(f, 'utf-8')).join('\n');
  let covered = 0;
  for (const df of dataFiles) {
    if (testContent.includes(df)) covered++;
  }
  return { total: dataFiles.length || 1, covered };
}

/**
 * Measure server startup + health response time
 * @returns {Promise<{ startMs: number, healthMs: number }>}
 */
async function measurePerformance() {
  const startMs = Date.now();
  let server;
  try {
    const { createServer } = await import('../src/server/index.js');
    server = createServer({ port: 19876 });
    await server.listen(19876);
    const afterStart = Date.now() - startMs;
    const healthStart = Date.now();
    const res = await fetch('http://localhost:19876/v1/health');
    await res.json();
    const healthMs = Date.now() - healthStart;
    await server.close();
    return { startMs: afterStart, healthMs };
  } catch {
    if (server) await server.close().catch(() => {});
    return { startMs: 9999, healthMs: 9999 };
  }
}

/**
 * Evaluate all rules and return scores
 * @returns {Promise<object>}
 */
export async function evaluateRules() {
  const schema = loadRulesSchema();
  if (!schema) {
    console.log('RULES.md not found — evaluation skipped.');
    const result = { timestamp: new Date().toISOString(), skipped: true, reason: 'RULES.md not found' };
    writeFileSync(join(ROOT, 'data', 'evaluation-scores.json'),
      JSON.stringify(result, null, 2));
    return result;
  }
  const ruleResults = [];
  const categoryScores = {};

  for (const cat of schema.categories) {
    let catScore = 0;
    const details = {};

    for (const rule of cat.rules) {
      let score = 0;
      let measurement = null;

      switch (rule.id) {
        case 'CQ-01': case 'CQ-03': case 'CQ-05': case 'PERF-03': case 'SEC-01': {
          const violations = countViolations(rule.pattern, rule.glob);
          measurement = violations;
          score = violations === 0 ? rule.maxPoints : Math.max(0, rule.maxPoints - violations);
          break;
        }
        case 'CQ-02': {
          const { total, documented } = countJSDocRatio(rule.glob);
          const ratio = documented / total;
          measurement = +ratio.toFixed(2);
          score = Math.round(rule.maxPoints * Math.min(1, ratio / rule.target));
          break;
        }
        case 'CQ-04': {
          const { total, conforming } = countFunctionLengths(rule.glob);
          const ratio = conforming / total;
          measurement = +ratio.toFixed(2);
          score = Math.round(rule.maxPoints * ratio);
          break;
        }
        case 'TC-01': {
          const pass = allTestsPass();
          measurement = pass;
          score = pass ? rule.maxPoints : 0;
          break;
        }
        case 'TC-02': {
          const { testFiles, srcFiles } = countFileCoverage();
          const ratio = testFiles / srcFiles;
          measurement = +ratio.toFixed(2);
          score = Math.round(rule.maxPoints * Math.min(1, ratio / rule.target));
          break;
        }
        case 'TC-03': {
          const count = countIntegrationTests();
          measurement = count;
          score = count >= rule.target ? rule.maxPoints : 0;
          break;
        }
        case 'TC-04': {
          const avg = avgAssertionsPerFile();
          measurement = +avg.toFixed(1);
          score = Math.round(rule.maxPoints * Math.min(1, avg / rule.target));
          break;
        }
        case 'TC-05': {
          const { total, covered } = routeTestCoverage();
          const ratio = covered / total;
          measurement = +ratio.toFixed(2);
          score = Math.round(rule.maxPoints * ratio);
          break;
        }
        case 'SEC-02': {
          const hasAuth = fileContains('src/server/index.js', ['auth(req', 'noAuthPaths']);
          measurement = hasAuth;
          score = hasAuth ? rule.maxPoints : 0;
          break;
        }
        case 'SEC-03': {
          const hasRL = fileContains('src/server/index.js', ['rateLimit(req']);
          measurement = hasRL;
          score = hasRL ? rule.maxPoints : 0;
          break;
        }
        case 'SEC-04': {
          const genValidates = fileContains('src/server/routes/generate.js', ['validateGenerateParams']);
          const anaValidates = fileContains('src/server/routes/analyze.js', ['validateAnalyzeParams']);
          measurement = genValidates && anaValidates;
          score = measurement ? rule.maxPoints : 0;
          break;
        }
        case 'PERF-01': case 'PERF-02': {
          const perf = await measurePerformance();
          const ms = rule.id === 'PERF-01' ? perf.startMs : perf.healthMs;
          measurement = ms;
          score = ms <= rule.target ? rule.maxPoints : Math.max(0, rule.maxPoints - Math.ceil((ms - rule.target) / 100));
          break;
        }
        case 'DOC-01': {
          measurement = fileContains('CLAUDE.md', ['SaaS', 'API proxy']);
          score = measurement ? rule.maxPoints : 0;
          break;
        }
        case 'DOC-02': {
          const { total, documented } = countJSDocRatio('src/server/routes/**/*.js');
          const ratio = documented / total;
          measurement = +ratio.toFixed(2);
          score = Math.round(rule.maxPoints * ratio);
          break;
        }
        case 'DOC-03': {
          measurement = fileContains('src/client/index.js', ['@example']);
          score = measurement ? rule.maxPoints : 0;
          break;
        }
        case 'DOC-04': {
          const hasCats = fileContains('RULES.md', ['code-quality', 'test-coverage', 'security', 'performance', 'documentation']);
          measurement = hasCats;
          score = hasCats ? rule.maxPoints : 0;
          break;
        }
        case 'DOC-05': {
          const { total, covered } = dataFileTestCoverage();
          const ratio = covered / total;
          measurement = +ratio.toFixed(2);
          score = Math.round(rule.maxPoints * ratio);
          break;
        }
      }

      ruleResults.push({
        id: rule.id,
        name: rule.name,
        score,
        max: rule.maxPoints,
        measurement,
        pass: score === rule.maxPoints,
      });
      details[rule.id] = { score, max: rule.maxPoints, measurement };
      catScore += score;
    }

    categoryScores[cat.id] = {
      score: catScore,
      max: cat.rules.reduce((s, r) => s + r.maxPoints, 0),
      details,
    };
  }

  const totalScore = Object.values(categoryScores).reduce((s, c) => s + c.score, 0);
  const maxScore = schema.maxScore;

  const result = {
    date: new Date().toISOString().split('T')[0],
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    passing: totalScore >= schema.passingThreshold,
    categories: categoryScores,
    ruleResults,
  };

  const scoresFile = join(ROOT, 'data', 'evaluation-scores.json');
  const existing = JSON.parse(readFileSync(scoresFile, 'utf-8'));
  const todayIdx = existing.evaluations.findIndex((e) => e.date === result.date);
  if (todayIdx >= 0) {
    existing.evaluations[todayIdx] = result;
  } else {
    existing.evaluations.push(result);
  }
  writeFileSync(scoresFile, JSON.stringify(existing, null, 2) + '\n');

  return result;
}

if (process.argv[1] && process.argv[1].includes('evaluate-rules.js')) {
  evaluateRules().then((result) => {
    if (result.skipped) {
      process.stdout.write(`\n${result.reason}\n`);
      return;
    }
    process.stdout.write(`\n=== Evaluation Results ===\n`);
    process.stdout.write(`Score: ${result.totalScore}/${result.maxScore} (${result.percentage}%)\n`);
    process.stdout.write(`Status: ${result.passing ? 'PASSING' : 'FAILING'}\n\n`);
    for (const [catId, cat] of Object.entries(result.categories)) {
      process.stdout.write(`  ${catId}: ${cat.score}/${cat.max}\n`);
    }
    process.stdout.write('\nDetailed:\n');
    for (const r of result.ruleResults) {
      const icon = r.pass ? '+' : '-';
      process.stdout.write(`  [${icon}] ${r.id}: ${r.score}/${r.max} (${r.name}) = ${r.measurement}\n`);
    }
  });
}
