/**
 * Structural Code Quality Evaluator
 *
 * Modes:
 *   --prepare    Generate codebase snapshot JSON (auto-measurable metrics)
 *   --store FILE Store Claude evaluation results to data/structural-scores.json
 *
 * Auto-measured rules (~40% of 100 points):
 *   SC-03: Max nesting depth (target <= 3)
 *   SM-01: Circular import detection (target = 0)
 *   SM-03: Config separation (no hardcoded URLs/magic numbers in logic)
 *   BR-01: Async error handling coverage (try/catch ratio)
 *   BR-03: let vs const ratio (target < 0.1)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Recursively find .js files in a directory
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
 * Extract import statements from a JS file
 * @param {string} content
 * @returns {string[]} imported paths
 */
function extractImports(content) {
  const imports = [];
  const re = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

/**
 * Build import graph and detect cycles
 * @returns {{ graph: object, cycles: string[][] }}
 */
function analyzeImportGraph() {
  const srcFiles = findJS(join(ROOT, 'src'));
  const graph = {};
  for (const f of srcFiles) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const content = readFileSync(f, 'utf-8');
    const imports = extractImports(content);
    graph[rel] = imports.filter(i => i.startsWith('.'));
  }
  const cycles = [];
  const visited = new Set();
  const stack = new Set();

  function dfs(node, path) {
    if (stack.has(node)) {
      cycles.push([...path, node]);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const dep of (graph[node] || [])) {
      const resolved = resolvePath(node, dep);
      if (resolved && graph[resolved]) {
        dfs(resolved, [...path, node]);
      }
    }
    stack.delete(node);
  }

  for (const node of Object.keys(graph)) dfs(node, []);
  return { graph, cycles };
}

/**
 * Resolve a relative import to a graph key
 */
function resolvePath(from, relImport) {
  const dir = dirname(from);
  const resolved = join(dir, relImport).replace(/\\/g, '/');
  if (!resolved.endsWith('.js')) return resolved + '.js';
  return resolved;
}

/**
 * Measure max nesting depth across all functions
 * @returns {{ maxDepth: number, functions: Array<{file:string, func:string, depth:number}> }}
 */
function measureNestingDepth() {
  const srcFiles = findJS(join(ROOT, 'src'));
  const results = [];
  let maxDepth = 0;
  for (const f of srcFiles) {
    const content = readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t.match(/^(export\s+)?(async\s+)?function\s+(\w+)/)) {
        const funcName = t.match(/function\s+(\w+)/)[1];
        let depth = 0;
        let localMax = 0;
        let braceCount = 0;
        let started = false;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') { braceCount++; started = true; depth = braceCount; }
            if (ch === '}') { braceCount--; }
            if (depth > localMax) localMax = depth;
          }
          if (started && braceCount === 0) break;
        }
        const nestDepth = Math.max(0, localMax - 1);
        results.push({ file: rel, func: funcName, depth: nestDepth });
        if (nestDepth > maxDepth) maxDepth = nestDepth;
      }
    }
  }
  return { maxDepth, functions: results };
}

/**
 * Check config separation - hardcoded URLs/numbers in non-config files
 * @returns {{ violations: Array<{file:string, line:number, match:string}> }}
 */
function checkConfigSeparation() {
  const srcFiles = findJS(join(ROOT, 'src'));
  const violations = [];
  const urlRe = /https?:\/\/[^\s'"]+/g;
  const configFiles = ['config.js', 'types.js'];
  for (const f of srcFiles) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    if (configFiles.some(c => rel.endsWith(c))) continue;
    const lines = readFileSync(f, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      let m;
      while ((m = urlRe.exec(line)) !== null) {
        violations.push({ file: rel, line: i + 1, match: m[0] });
      }
    }
  }
  return { violations };
}

/**
 * Measure async error handling coverage
 * @returns {{ total: number, handled: number, ratio: number }}
 */
function measureAsyncErrorHandling() {
  const srcFiles = findJS(join(ROOT, 'src'));
  let total = 0;
  let handled = 0;
  for (const f of srcFiles) {
    const content = readFileSync(f, 'utf-8');
    const asyncFuncs = content.match(/async\s+(function\s+\w+|\w+\s*=\s*async|\(\s*\w)/g);
    if (!asyncFuncs) continue;
    total += asyncFuncs.length;
    const tryCatches = content.match(/try\s*\{/g);
    const catches = content.match(/\.catch\s*\(/g);
    handled += (tryCatches ? tryCatches.length : 0) + (catches ? catches.length : 0);
  }
  return {
    total: total || 1,
    handled: Math.min(handled, total),
    ratio: +(Math.min(handled, total) / (total || 1)).toFixed(2),
  };
}

/**
 * Measure let vs const ratio
 * @returns {{ letCount: number, constCount: number, ratio: number }}
 */
function measureMutability() {
  const srcFiles = findJS(join(ROOT, 'src'));
  let letCount = 0;
  let constCount = 0;
  for (const f of srcFiles) {
    const content = readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      const lets = line.match(/\blet\s+/g);
      const consts = line.match(/\bconst\s+/g);
      if (lets) letCount += lets.length;
      if (consts) constCount += consts.length;
    }
  }
  const total = letCount + constCount || 1;
  return {
    letCount,
    constCount,
    ratio: +(letCount / total).toFixed(3),
  };
}

/**
 * Collect exported function signatures per file
 * @returns {object}
 */
function collectExports() {
  const srcFiles = findJS(join(ROOT, 'src'));
  const exports = {};
  for (const f of srcFiles) {
    const rel = relative(ROOT, f).replace(/\\/g, '/');
    const content = readFileSync(f, 'utf-8');
    const funcs = [];
    const re = /export\s+(async\s+)?function\s+(\w+)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      funcs.push({ name: m[2], async: !!m[1] });
    }
    const classRe = /export\s+class\s+(\w+)/g;
    while ((m = classRe.exec(content)) !== null) {
      funcs.push({ name: m[1], type: 'class' });
    }
    if (funcs.length > 0) exports[rel] = funcs;
  }
  return exports;
}

/**
 * Score auto-measurable rules
 * @returns {object}
 */
function scoreAutoRules(snapshot) {
  const scores = {};

  // SC-03: Max nesting depth (5 pts, target <= 3)
  const deepFuncs = snapshot.nesting.functions.filter(f => f.depth > 3);
  scores['SC-03'] = {
    score: deepFuncs.length === 0 ? 5 : Math.max(0, 5 - deepFuncs.length),
    max: 5,
    measurement: { maxDepth: snapshot.nesting.maxDepth, violations: deepFuncs.length },
  };

  // SM-01: Circular imports (7 pts, target = 0)
  scores['SM-01'] = {
    score: snapshot.imports.cycles.length === 0 ? 7 : 0,
    max: 7,
    measurement: { cycles: snapshot.imports.cycles.length },
  };

  // SM-03: Config separation (6 pts)
  const configViols = snapshot.configSeparation.violations.length;
  scores['SM-03'] = {
    score: Math.max(0, 6 - configViols),
    max: 6,
    measurement: { violations: configViols },
  };

  // BR-01: Async error handling (6 pts)
  const errRatio = snapshot.asyncErrorHandling.ratio;
  scores['BR-01'] = {
    score: Math.round(6 * errRatio),
    max: 6,
    measurement: snapshot.asyncErrorHandling,
  };

  // BR-03: Let/const ratio (5 pts, target < 0.1)
  const mutRatio = snapshot.mutability.ratio;
  scores['BR-03'] = {
    score: mutRatio <= 0.1 ? 5 : Math.max(0, 5 - Math.ceil((mutRatio - 0.1) * 20)),
    max: 5,
    measurement: snapshot.mutability,
  };

  const autoTotal = Object.values(scores).reduce((s, r) => s + r.score, 0);
  const autoMax = Object.values(scores).reduce((s, r) => s + r.max, 0);

  return { scores, autoTotal, autoMax };
}

/**
 * Generate the full codebase snapshot
 * @returns {object}
 */
function prepareSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    rubricVersion: '1.0.0',
    sourceFiles: findJS(join(ROOT, 'src')).map(f => relative(ROOT, f).replace(/\\/g, '/')),
    imports: analyzeImportGraph(),
    nesting: measureNestingDepth(),
    configSeparation: checkConfigSeparation(),
    asyncErrorHandling: measureAsyncErrorHandling(),
    mutability: measureMutability(),
    exports: collectExports(),
  };

  const auto = scoreAutoRules(snapshot);
  snapshot.autoScores = auto;

  return snapshot;
}

/**
 * Store evaluation results from Claude
 * @param {string} inputFile
 */
function storeResults(inputFile) {
  const results = JSON.parse(readFileSync(inputFile, 'utf-8'));
  const scoresFile = join(ROOT, 'data', 'structural-scores.json');
  let existing;
  try {
    existing = JSON.parse(readFileSync(scoresFile, 'utf-8'));
  } catch {
    existing = { rubricVersion: '1.0.0', maxScore: 100, evaluations: [] };
  }

  const todayIdx = existing.evaluations.findIndex(e => e.date === results.date);
  if (todayIdx >= 0) {
    existing.evaluations[todayIdx] = results;
  } else {
    existing.evaluations.push(results);
  }

  writeFileSync(scoresFile, JSON.stringify(existing, null, 2) + '\n');
  process.stdout.write(`Stored structural evaluation for ${results.date}\n`);
}

// ---- CLI ----

const args = process.argv.slice(2);

if (args.includes('--prepare')) {
  const snapshot = prepareSnapshot();
  const output = JSON.stringify(snapshot, null, 2);
  process.stdout.write(output + '\n');

  process.stderr.write('\n=== Structural Auto-Scores ===\n');
  process.stderr.write(`Auto-measurable: ${snapshot.autoScores.autoTotal}/${snapshot.autoScores.autoMax}\n`);
  for (const [id, r] of Object.entries(snapshot.autoScores.scores)) {
    const icon = r.score === r.max ? '+' : '-';
    process.stderr.write(`  [${icon}] ${id}: ${r.score}/${r.max}\n`);
  }
  process.stderr.write(`\nClaude evaluation needed for remaining ${100 - snapshot.autoScores.autoMax} points.\n`);
  process.stderr.write('Run Claude with this snapshot + STRUCTURAL-RUBRIC.md to complete evaluation.\n');
} else if (args.includes('--store') && args[args.indexOf('--store') + 1]) {
  storeResults(args[args.indexOf('--store') + 1]);
} else {
  process.stderr.write('Usage:\n');
  process.stderr.write('  node evaluate-structural.js --prepare     Generate snapshot\n');
  process.stderr.write('  node evaluate-structural.js --store FILE  Store results\n');
}
