/**
 * Zero-dependency lint script
 * Checks code quality rules that can be verified with regex/file analysis
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const RULES = [
  { id: 'no-require', pattern: /(?<!\w)require\s*\(['"]/g, message: 'Use ES import instead of require()' },
  { id: 'no-var', pattern: /^\s*var\s+/g, message: 'Use let/const instead of var' },
];

/**
 * Recursively find JS files
 * @param {string} dir
 * @returns {string[]}
 */
function findFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findFiles(full));
    } else if (entry.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Run lint checks
 * @returns {{ pass: boolean, violations: { file: string, line: number, rule: string, message: string }[] }}
 */
export function lint() {
  const violations = [];
  const srcFiles = findFiles(join(ROOT, 'src'));
  const scriptFiles = findFiles(join(ROOT, 'scripts'));
  const allFiles = [...srcFiles, ...scriptFiles];

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relPath = file.replace(ROOT + '/', '');

    for (const rule of RULES) {
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          violations.push({
            file: relPath,
            line: i + 1,
            rule: rule.id,
            message: rule.message,
          });
        }
        rule.pattern.lastIndex = 0;
      }
    }
  }

  return { pass: violations.length === 0, violations };
}

if (process.argv[1] && process.argv[1].includes('lint.js')) {
  const result = lint();
  if (result.pass) {
    process.stdout.write('Lint passed: 0 violations\n');
  } else {
    for (const v of result.violations) {
      process.stdout.write(`${v.file}:${v.line} [${v.rule}] ${v.message}\n`);
    }
    process.stdout.write(`\nLint failed: ${result.violations.length} violation(s)\n`);
    process.exit(1);
  }
}
