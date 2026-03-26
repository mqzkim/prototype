import https from 'https';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const TRENDING_DATA_PATH = join(ROOT, 'data', 'trending.json');
const TRENDING_URL = 'https://github.com/trending';

/**
 * Fetch a URL and return the response body as a string.
 */
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrendingTracker/1.0)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse the GitHub trending page HTML and extract repo information.
 * Returns an array of repo objects (up to 10).
 */
function parseTrendingHTML(html) {
  const repos = [];
  // Each trending repo is inside an <article class="Box-row">
  const articleRegex = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  let match;

  while ((match = articleRegex.exec(html)) !== null && repos.length < 10) {
    const article = match[1];

    // Extract repo name (owner/repo) from the h2 > a link
    const nameMatch = article.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="\/([^"]+)"[\s\S]*?<\/h2>/);
    if (!nameMatch) continue;
    const fullName = nameMatch[1].replace(/\s+/g, '').trim();

    // Extract description from <p class="...">
    const descMatch = article.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]*>/g, '').trim()
      : '';

    // Extract programming language
    const langMatch = article.match(/<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]+)<\/span>/);
    const language = langMatch ? langMatch[1].trim() : null;

    // Extract stars count
    const starsMatch = article.match(/<a[^>]*href="\/[^"]*\/stargazers"[^>]*>[\s]*([^<]+)/);
    let stars = 0;
    if (starsMatch) {
      stars = parseStarCount(starsMatch[1].trim());
    }

    const url = `https://github.com/${fullName}`;

    repos.push({
      name: fullName,
      description,
      language,
      stars,
      url
    });
  }

  return repos;
}

/**
 * Parse star count strings like "1,234" or "12.5k" into numbers.
 */
function parseStarCount(str) {
  if (!str) return 0;
  str = str.replace(/,/g, '').trim();
  if (str.toLowerCase().endsWith('k')) {
    return Math.round(parseFloat(str) * 1000);
  }
  return parseInt(str, 10) || 0;
}

/**
 * Read the current trending data from disk.
 */
function readTrendingData() {
  try {
    const raw = fs.readFileSync(TRENDING_DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_fetched: null, daily: [] };
  }
}

/**
 * Write trending data to disk.
 */
function writeTrendingData(data) {
  fs.writeFileSync(TRENDING_DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Fetch GitHub trending repos and save to data/trending.json.
 * Idempotent: skips if today already has an entry.
 */
export async function fetchTrending() {
  const today = new Date().toISOString().slice(0, 10);
  const data = readTrendingData();

  // Idempotent check: skip if today already has an entry
  const alreadyFetched = data.daily.some((entry) => entry.date === today);
  if (alreadyFetched) {
    console.log(`[fetch-trending] Already have data for ${today}, skipping.`);
    return data;
  }

  let repos;
  try {
    console.log('[fetch-trending] Fetching GitHub trending page...');
    const html = await fetchPage(TRENDING_URL);
    repos = parseTrendingHTML(html);
    console.log(`[fetch-trending] Parsed ${repos.length} trending repos.`);
  } catch (err) {
    console.warn(`[fetch-trending] WARNING: Failed to fetch trending data: ${err.message}`);
    console.warn('[fetch-trending] Skipping update.');
    return data;
  }

  if (repos.length === 0) {
    console.warn('[fetch-trending] WARNING: No repos parsed from trending page. Skipping update.');
    return data;
  }

  data.daily.push({
    date: today,
    repos
  });

  data.last_fetched = today;

  writeTrendingData(data);
  console.log(`[fetch-trending] Saved ${repos.length} trending repos for ${today}.`);

  return data;
}

// Allow running directly: node scripts/fetch-trending.js
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  fetchTrending().catch((err) => {
    console.error('[fetch-trending] Unexpected error:', err);
    process.exit(1);
  });
}
