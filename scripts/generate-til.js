import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────

function loadJSON(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf-8'));
}

function saveJSON(relativePath, data) {
  writeFileSync(join(ROOT, relativePath), JSON.stringify(data, null, 2) + '\n');
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Recursively collect all source file paths under given directories.
 */
function collectSourceFiles(dirs) {
  const files = [];
  const extensions = ['.js', '.ts', '.html', '.css', '.json'];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  for (const d of dirs) {
    walk(join(ROOT, d));
  }
  return files;
}

/**
 * Read all source content into a single string for pattern matching.
 */
function readAllSources(dirs) {
  const files = collectSourceFiles(dirs);
  const contents = {};
  for (const f of files) {
    contents[f] = readFileSync(f, 'utf-8');
  }
  return contents;
}

// ── Analysis Rules ───────────────────────────────────────────────────
// Each rule has:
//   id       – unique slug (used to de-duplicate against til.json)
//   title    – human-readable TIL title
//   category – topic category
//   test     – function(allContent: Record<path,string>) => boolean
//   content  – the TIL explanation

const RULES = [
  {
    id: 'esm-imports',
    title: 'ESM Import/Export Syntax',
    category: 'nodejs',
    test: (all) => Object.values(all).some(c => /^import\s+.+\s+from\s+['"]/.test(c)),
    content: 'The codebase uses native ES module import/export syntax throughout, enabled by "type": "module" in package.json. This avoids CommonJS require() and allows top-level await.'
  },
  {
    id: 'json-file-storage',
    title: 'JSON Files as a Database',
    category: 'architecture',
    test: (all) => Object.values(all).some(c => /readFileSync.*\.json/.test(c) && /writeFileSync.*\.json/.test(c)),
    content: 'Instead of using a database, this project stores all state as JSON files in the data/ directory. This keeps the project dependency-free and allows version-controlling application state via git.'
  },
  {
    id: 'fileurltopath',
    title: 'fileURLToPath for __dirname in ESM',
    category: 'nodejs',
    test: (all) => Object.values(all).some(c => c.includes('fileURLToPath')),
    content: 'In ES modules, __dirname is not available. The pattern dirname(fileURLToPath(import.meta.url)) recreates it, converting the module URL to a filesystem path.'
  },
  {
    id: 'idempotent-operations',
    title: 'Idempotent Daily Updates',
    category: 'patterns',
    test: (all) => Object.values(all).some(c => /already exists.*[Ss]kipping/.test(c)),
    content: 'The daily update script checks whether today\'s entry already exists before adding a new one, making the operation idempotent. Running it multiple times on the same day produces the same result.'
  },
  {
    id: 'css-variables',
    title: 'CSS Custom Properties for Theming',
    category: 'css',
    test: (all) => Object.values(all).some(c => /:root\s*\{[^}]*--\w+/.test(c)),
    content: 'The site uses CSS custom properties (variables) defined on :root for consistent theming. Colors like --violet, --cyan, and --emerald are reused across components, making theme changes trivial.'
  },
  {
    id: 'template-replacement',
    title: 'Mustache-Style Template Placeholders',
    category: 'build',
    test: (all) => Object.values(all).some(c => /\{\{[A-Z_]+\}\}/.test(c)),
    content: 'The build system uses simple {{PLACEHOLDER}} tokens in HTML templates, replaced at build time with String.replace(). This avoids heavy template engine dependencies while keeping templates readable.'
  },
  {
    id: 'git-exec-sync',
    title: 'Collecting Git Stats via execSync',
    category: 'nodejs',
    test: (all) => Object.values(all).some(c => /execSync.*git\s/.test(c)),
    content: 'The collect-stats script shells out to git commands using child_process.execSync to gather repository metrics like commit count, branch count, and project age, parsing the output as strings.'
  },
  {
    id: 'recursive-file-walking',
    title: 'Recursive Directory Walking',
    category: 'nodejs',
    test: (all) => Object.values(all).some(c => /readdirSync.*withFileTypes/.test(c) && /isDirectory/.test(c)),
    content: 'The project uses recursive directory traversal with readdirSync({ withFileTypes: true }) and dirent.isDirectory() to walk file trees for stats collection, skipping node_modules and hidden directories.'
  },
  {
    id: 'gradient-text',
    title: 'Gradient Text with background-clip',
    category: 'css',
    test: (all) => Object.values(all).some(c => /background-clip:\s*text/.test(c)),
    content: 'The dashboard renders gradient-colored text using background: linear-gradient(...) combined with -webkit-background-clip: text and -webkit-text-fill-color: transparent, a purely CSS technique.'
  },
  {
    id: 'version-bumping',
    title: 'Automatic Patch Version Bumping',
    category: 'patterns',
    test: (all) => Object.values(all).some(c => /split\(['"]\.['"].*map\(Number\)/.test(c)),
    content: 'Each daily update automatically increments the patch version by splitting the semver string, converting parts to numbers, and incrementing the last segment, keeping a running version history.'
  },
  {
    id: 'mkdirSync-recursive',
    title: 'Safe Directory Creation with recursive',
    category: 'nodejs',
    test: (all) => Object.values(all).some(c => /mkdirSync.*recursive:\s*true/.test(c)),
    content: 'The build script uses mkdirSync with { recursive: true } to ensure the dist/ output directory exists before writing files. This is safe to call even when the directory already exists.'
  },
  {
    id: 'backdrop-filter',
    title: 'Frosted Glass with backdrop-filter',
    category: 'css',
    test: (all) => Object.values(all).some(c => /backdrop-filter:\s*blur/.test(c)),
    content: 'The UI achieves a frosted-glass card effect using backdrop-filter: blur() combined with semi-transparent backgrounds, giving depth without heavy image assets.'
  },
  {
    id: 'array-slice-reverse',
    title: 'Non-Mutating Array Reversal with slice()',
    category: 'javascript',
    test: (all) => Object.values(all).some(c => /\.slice\(\)[\s\n]*\.reverse\(\)/.test(c)),
    content: 'The timeline is displayed in reverse-chronological order using .slice().reverse(), which creates a shallow copy first to avoid mutating the original entries array.'
  },
  {
    id: 'css-animations',
    title: 'CSS Keyframe Animations',
    category: 'css',
    test: (all) => Object.values(all).some(c => /@keyframes\s+\w+/.test(c)),
    content: 'The dashboard uses CSS @keyframes animations for the pulsing health indicator and blinking cursor, creating lively UI feedback without any JavaScript animation code.'
  },
  {
    id: 'semver-delta',
    title: 'Computing Metric Deltas Between Snapshots',
    category: 'patterns',
    test: (all) => Object.values(all).some(c => /delta/.test(c) && /prev/.test(c)),
    content: 'The daily update computes deltas by comparing the current stats snapshot with the previous one, presenting changes as "+N commits" or "+N lines" for a clear changelog.'
  },
  {
    id: 'streak-tracking',
    title: 'Consecutive Day Streak Tracking',
    category: 'patterns',
    test: (all) => Object.values(all).some(c => /streak/.test(c) && /diffDays/.test(c)),
    content: 'The metrics system tracks consecutive active days by computing the difference between today and the last update date. If the gap is more than one day, the streak resets to 1.'
  },
  {
    id: 'du-command-size',
    title: 'Measuring Repo Size with du',
    category: 'shell',
    test: (all) => Object.values(all).some(c => /du\s+-sk/.test(c)),
    content: 'Repository size is measured by shelling out to `du -sk` with --exclude flags for node_modules and .git, giving a quick kilobyte estimate of the project working tree.'
  },
  {
    id: 'radial-gradient-glow',
    title: 'Ambient Background Glow with Radial Gradients',
    category: 'css',
    test: (all) => Object.values(all).some(c => /radial-gradient.*transparent/.test(c) && /body::before/.test(c)),
    content: 'The page background uses fixed pseudo-elements with radial-gradient to produce subtle ambient glows in violet and cyan, adding depth to the dark theme without any images.'
  },
  {
    id: 'github-pages-deploy',
    title: 'Static Deployment via GitHub Pages',
    category: 'devops',
    test: () => {
      try { readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf-8'); return true; } catch { return false; }
    },
    content: 'The project deploys automatically to GitHub Pages via a GitHub Actions workflow, building the static site and pushing the dist/ folder as the published artifact.'
  },
  {
    id: 'filter-boolean',
    title: 'Filtering Falsy Values with .filter(Boolean)',
    category: 'javascript',
    test: (all) => Object.values(all).some(c => /\.filter\(Boolean\)/.test(c)),
    content: 'The codebase uses .filter(Boolean) to remove null/undefined entries from arrays, a concise JavaScript idiom that leverages the Boolean constructor as a predicate function.'
  },
  {
    id: 'tabular-nums',
    title: 'Tabular Numerals for Aligned Numbers',
    category: 'css',
    test: (all) => Object.values(all).some(c => /font-variant-numeric:\s*tabular-nums/.test(c)),
    content: 'The stat cards use font-variant-numeric: tabular-nums to ensure digits are equally spaced, preventing layout shifts when numbers change (e.g., from 99 to 100).'
  }
];

// ── Main Logic ───────────────────────────────────────────────────────

export function generateTIL() {
  const today = getToday();
  const tilData = loadJSON('data/til.json');

  // Idempotent: skip if today already has an entry
  if (tilData.entries.some(e => e.date === today)) {
    console.log(`TIL entry for ${today} already exists. Skipping.`);
    return null;
  }

  // Read source files
  const allContent = readAllSources(['src', 'scripts']);

  // Determine which rule IDs have already been covered
  const coveredTitles = new Set(tilData.entries.map(e => e.title));

  // Find the first rule that matches the codebase and hasn't been used
  let picked = null;
  for (const rule of RULES) {
    if (coveredTitles.has(rule.title)) continue;
    try {
      if (rule.test(allContent)) {
        picked = rule;
        break;
      }
    } catch {
      // If a rule's test fails, skip it
      continue;
    }
  }

  if (!picked) {
    console.log('No new TIL pattern found (all rules covered or no match). Skipping.');
    return null;
  }

  const newEntry = {
    date: today,
    title: picked.title,
    content: picked.content,
    category: picked.category
  };

  tilData.entries.push(newEntry);
  saveJSON('data/til.json', tilData);

  console.log(`TIL generated for ${today}: "${picked.title}" [${picked.category}]`);
  return newEntry;
}

// Run directly
if (process.argv[1] && process.argv[1].includes('generate-til')) {
  generateTIL();
}
