import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

/**
 * Selects a daily quote deterministically based on the date.
 * Same date always produces the same quote (idempotent).
 *
 * @param {string} [dateStr] - Optional date string (YYYY-MM-DD). Defaults to today.
 * @returns {{ date: string, quote: { text: string, author: string } }}
 */
export function selectDailyQuote(dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);

  const quotesPath = join(ROOT, 'data', 'quotes.json');
  const quotesData = JSON.parse(readFileSync(quotesPath, 'utf-8'));
  const quotes = quotesData.quotes;

  // Deterministic hash from date string
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % quotes.length;

  const selected = {
    date,
    quote: quotes[index],
  };

  const outputPath = join(ROOT, 'data', 'daily-quote.json');
  writeFileSync(outputPath, JSON.stringify(selected, null, 2) + '\n', 'utf-8');

  return selected;
}

// Run directly when executed as a script
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const result = selectDailyQuote();
  console.log(`Selected quote for ${result.date}:`);
  console.log(`  "${result.quote.text}" — ${result.quote.author}`);
}
