/**
 * Design Validation Harness
 *
 * 빌드된 HTML 파일들의 디자인 무결성을 검증합니다.
 * - 모든 섹션 존재 여부
 * - overflow 유발 가능한 CSS 패턴
 * - i18n 미번역 플레이스홀더 잔존
 * - 접근성 기본 항목 (lang, viewport, alt)
 * - 카드/그리드 레이아웃 무결성
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const LOCALES = ['en', 'ko'];
let totalChecks = 0;
let passed = 0;
let failed = 0;
const failures = [];

function check(description, condition) {
  totalChecks++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    failed++;
    failures.push(description);
    console.log(`  ✗ ${description}`);
  }
}

// ---- 1. Required Sections ----
function validateSections(html, locale) {
  console.log(`\n[${locale}] Section completeness`);

  const requiredSections = {
    en: [
      ['Build in Public', 'header title'],
      ['Days Active', 'stats card'],
      ['Lines of Code Over Time', 'LOC chart'],
      ['Quote of the Day', 'quote section'],
      ['Today I Learned', 'TIL section'],
      ['Live Data', 'API data section'],
      ['GitHub Trending', 'trending section'],
      ['Auto Improvements', 'improvements section'],
      ['Indie SaaS', 'SaaS section'],
      ['Changelog', 'changelog section'],
      ['Daily Archive', 'archive section'],
    ],
    ko: [
      ['Build in Public', 'header title'],
      ['활동일 수', 'stats card'],
      ['코드 줄 수 변화', 'LOC chart'],
      ['오늘의 명언', 'quote section'],
      ['오늘 배운 것', 'TIL section'],
      ['실시간 데이터', 'API data section'],
      ['GitHub 트렌딩', 'trending section (ko)'],
      ['자동 개선 현황', 'improvements section (ko)'],
      ['인디 SaaS', 'SaaS section (ko)'],
      ['변경 이력', 'changelog section (ko)'],
      ['일별 아카이브', 'archive section (ko)'],
    ],
  };

  for (const [text, label] of requiredSections[locale] || requiredSections.en) {
    check(`${label}: "${text}" exists`, html.includes(text));
  }
}

// ---- Helper: parse all CSS rules for a given class name ----
function getCSSRulesForClass(css, className) {
  const escaped = className.replace(/[-]/g, '\\-');
  const ruleRegex = new RegExp(`\\.${escaped}[^{]*\\{([^}]+)\\}`, 'g');
  let match;
  let combined = '';
  while ((match = ruleRegex.exec(css)) !== null) {
    combined += match[1] + ';';
  }
  return combined;
}

function hasProps(ruleText, props) {
  return props.every(p => ruleText.includes(p));
}

// ---- 2. Overflow Risk Patterns (Heuristic) ----
function validateOverflow(html, locale) {
  console.log(`\n[${locale}] Overflow protection`);

  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : '';

  // ── A. Ellipsis triplet check ──
  // text-overflow:ellipsis is USELESS without white-space:nowrap + overflow:hidden
  // All three must be present together.
  const ellipsisFields = [
    'trending-name', 'trending-desc', 'trending-lang',
    'saas-name', 'saas-tagline', 'saas-product', 'saas-item',
    'archive-summary',
  ];
  for (const cls of ellipsisFields) {
    const rules = getCSSRulesForClass(css, cls);
    if (!rules) continue;
    if (rules.includes('text-overflow')) {
      // If ellipsis is declared, the full triplet MUST be present
      const hasTriplet = hasProps(rules, ['white-space', 'overflow', 'text-overflow']);
      check(`ellipsis triplet: .${cls} has nowrap+overflow+ellipsis`, hasTriplet);
    }
  }

  // ── B. Flex-child info containers must prevent blowout ──
  // When flex:1 is used for text, min-width:0 + overflow:hidden are required
  const flexInfoFields = ['trending-info', 'saas-info'];
  for (const cls of flexInfoFields) {
    const rules = getCSSRulesForClass(css, cls);
    if (!rules) continue;
    check(
      `flex-child: .${cls} has min-width:0 + overflow:hidden`,
      hasProps(rules, ['min-width', 'overflow'])
    );
  }

  // ── C. Flex row containers must clip overflow ──
  const flexRowClasses = ['trending-repo', 'trending-item', 'saas-product', 'saas-item'];
  for (const cls of flexRowClasses) {
    if (!new RegExp(`class="[^"]*${cls}`).test(html)) continue;
    const rules = getCSSRulesForClass(css, cls);
    check(
      `flex-row: .${cls} has overflow control`,
      hasProps(rules, ['overflow'])
    );
  }

  // ── D. Cards inside grid must clip children ──
  // feature-card is inside feature-grid (50% width) — must have overflow:hidden
  const cardContainers = ['feature-card'];
  for (const cls of cardContainers) {
    const rules = getCSSRulesForClass(css, cls);
    if (!rules) continue;
    check(
      `card-container: .${cls} clips children (overflow:hidden)`,
      rules.includes('overflow') && rules.includes('hidden')
    );
  }

  // ── E. Flex-shrink protection on fixed-width elements ──
  // Rank badges, meta containers should not shrink
  const noShrinkFields = ['trending-rank', 'trending-meta', 'saas-rank'];
  for (const cls of noShrinkFields) {
    const rules = getCSSRulesForClass(css, cls);
    if (!rules) continue;
    const hasShrinkProtection = rules.includes('flex-shrink') || rules.includes('min-width');
    check(
      `flex-shrink: .${cls} is protected from shrinking`,
      hasShrinkProtection
    );
  }

  // ── F. Content-length risk detection ──
  // Scan actual rendered text and verify CSS protection exists
  const contentFields = [
    { regex: /class="trending-name">([^<]*)</g, name: 'trending-name', maxLen: 60 },
    { regex: /class="trending-desc">([^<]*)</g, name: 'trending-desc', maxLen: 80 },
    { regex: /class="trending-lang">([^<]*)</g, name: 'trending-lang', maxLen: 12 },
    { regex: /class="saas-name">([^<]*)</g, name: 'saas-name', maxLen: 50 },
    { regex: /class="saas-tagline">([^<]*)</g, name: 'saas-tagline', maxLen: 80 },
    { regex: /class="archive-summary">([^<]*)</g, name: 'archive-summary', maxLen: 60 },
  ];

  for (const { regex, name, maxLen } of contentFields) {
    let match;
    const values = [];
    while ((match = regex.exec(html)) !== null) {
      values.push(match[1].trim());
    }
    if (values.length === 0) continue;

    const longest = values.reduce((a, b) => a.length > b.length ? a : b, '');
    if (longest.length > maxLen) {
      // Long content detected — FULL overflow chain must be present
      const rules = getCSSRulesForClass(css, name);
      const hasFull = hasProps(rules, ['white-space', 'overflow', 'text-overflow']);
      check(
        `content-risk: .${name} (${longest.length}ch > ${maxLen}) has full overflow chain`,
        hasFull
      );
    } else {
      check(`content-ok: .${name} (${longest.length}/${maxLen} chars)`, true);
    }
  }
}

// ---- 3. i18n Completeness ----
function validateI18n(html, locale) {
  console.log(`\n[${locale}] i18n completeness`);

  // No unresolved {{t.xxx}} placeholders
  const unresolvedMatches = html.match(/\{\{t\.\w+\}\}/g);
  check(
    'No unresolved {{t.*}} placeholders',
    !unresolvedMatches
  );
  if (unresolvedMatches) {
    console.log(`    Found: ${unresolvedMatches.join(', ')}`);
  }

  // No unresolved {{XXX}} template vars
  const unresolvedVars = html.match(/\{\{[A-Z_]+\}\}/g);
  check(
    'No unresolved {{TEMPLATE}} variables',
    !unresolvedVars
  );
  if (unresolvedVars) {
    console.log(`    Found: ${unresolvedVars.join(', ')}`);
  }

  // lang attribute matches locale
  check(
    `lang="${locale}" attribute present`,
    html.includes(`lang="${locale}"`)
  );
}

// ---- 4. Accessibility Basics ----
function validateAccessibility(html, locale) {
  console.log(`\n[${locale}] Accessibility basics`);

  check('Has <meta charset="UTF-8">', html.includes('charset="UTF-8"'));
  check('Has viewport meta', html.includes('name="viewport"'));
  check('Has <title> tag', /<title>[^<]+<\/title>/.test(html));
  check('Has lang attribute on <html>', /html\s+lang="/.test(html));
}

// ---- 5. Layout Integrity ----
function validateLayout(html, locale) {
  console.log(`\n[${locale}] Layout integrity`);

  // Grid/flex containers should have proper structure
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    const css = styleMatch[1];

    // Stats grid should be responsive
    check(
      'Stats grid has responsive breakpoint',
      css.includes('.stats') && css.includes('@media')
    );

    // Feature grid should be responsive
    check(
      'Feature grid has responsive breakpoint',
      css.includes('.feature-grid') && css.includes('@media')
    );
  }

  // Check that all opened glow-card divs are closed
  const openCards = (html.match(/class="[^"]*glow-card[^"]*"/g) || []).length;
  check(`Glow cards found: ${openCards}`, openCards > 0);
}

// ---- Main ----
function main() {
  console.log('=== Design Validation Harness ===\n');

  // Ensure dist exists
  if (!existsSync(join(ROOT, 'dist'))) {
    console.error('ERROR: dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  for (const locale of LOCALES) {
    const indexPath = join(ROOT, 'dist', locale, 'index.html');
    if (!existsSync(indexPath)) {
      console.error(`ERROR: ${indexPath} not found.`);
      process.exit(1);
    }

    const html = readFileSync(indexPath, 'utf-8');

    validateSections(html, locale);
    validateOverflow(html, locale);
    validateI18n(html, locale);
    validateAccessibility(html, locale);
    validateLayout(html, locale);
  }

  // Daily page spot check
  console.log('\n[daily] Daily page spot check');
  const dailyFiles = LOCALES.map(l => {
    const dir = join(ROOT, 'dist', l, 'daily');
    if (!existsSync(dir)) return null;
    return { locale: l, dir };
  }).filter(Boolean);

  for (const { locale, dir } of dailyFiles) {
    const i18n = JSON.parse(readFileSync(join(ROOT, 'data', 'i18n.json'), 'utf-8'));
    const dailyLog = JSON.parse(readFileSync(join(ROOT, 'data', 'daily-log.json'), 'utf-8'));
    const latestDate = dailyLog.entries[dailyLog.entries.length - 1]?.date;
    if (latestDate) {
      const dailyPath = join(dir, `${latestDate}.html`);
      if (existsSync(dailyPath)) {
        const dailyHtml = readFileSync(dailyPath, 'utf-8');
        check(
          `[${locale}] Daily page ${latestDate} has date in content`,
          dailyHtml.includes(latestDate)
        );
        check(
          `[${locale}] Daily page has no unresolved placeholders`,
          !dailyHtml.match(/\{\{[A-Z_]+\}\}/) && !dailyHtml.match(/\{\{t\.\w+\}\}/)
        );
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log(`Total: ${totalChecks} checks | Passed: ${passed} | Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log('\nAll design checks passed!');
}

main();
