import https from 'https';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const DATA_PATH = join(ROOT, 'data', 'saas.json');
const PH_URL = 'https://www.producthunt.com/';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SaaSTracker/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
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
 * Parse Product Hunt homepage HTML to extract top products.
 * Returns array of { name, tagline, url, votes, topics }.
 */
function parseProductHuntHTML(html) {
  const products = [];

  // PH renders product cards with data attributes and structured HTML
  // Look for product links with names and taglines
  const sectionRegex = /data-test="post-item[^"]*"[\s\S]*?<a[^>]*href="(\/posts\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = sectionRegex.exec(html)) !== null && products.length < 10) {
    const href = match[1];
    const block = match[2];

    const nameMatch = block.match(/>([^<]{2,60})</);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    if (!name || name.length < 2) continue;

    products.push({
      name,
      tagline: '',
      url: `https://www.producthunt.com${href}`,
      votes: null,
      topics: [],
    });
  }

  // Fallback: try to find product names from og/meta or structured data
  if (products.length === 0) {
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let ldMatch;
    while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        if (ld['@type'] === 'ItemList' && Array.isArray(ld.itemListElement)) {
          for (const item of ld.itemListElement.slice(0, 10)) {
            if (item.name) {
              products.push({
                name: item.name,
                tagline: item.description || '',
                url: item.url || '',
                votes: null,
                topics: [],
              });
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }
  }

  return products;
}

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_fetched: null, daily: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Fetch trending SaaS/indie products from Product Hunt and save to data/saas.json.
 * Idempotent: skips if today already has an entry.
 */
export async function fetchSaaS() {
  const today = new Date().toISOString().slice(0, 10);
  const data = readData();

  const alreadyFetched = data.daily.some((entry) => entry.date === today);
  if (alreadyFetched) {
    console.log(`[fetch-saas] Already have data for ${today}, skipping.`);
    return data;
  }

  let products;
  try {
    console.log('[fetch-saas] Fetching Product Hunt page...');
    const html = await fetchPage(PH_URL);
    products = parseProductHuntHTML(html);
    console.log(`[fetch-saas] Parsed ${products.length} products.`);
  } catch (err) {
    console.warn(`[fetch-saas] WARNING: Failed to fetch data: ${err.message}`);
    console.warn('[fetch-saas] Skipping update.');
    return data;
  }

  if (products.length === 0) {
    console.warn('[fetch-saas] WARNING: No products parsed. Skipping update.');
    return data;
  }

  data.daily.push({
    date: today,
    source: 'producthunt',
    products,
  });

  data.last_fetched = today;
  writeData(data);
  console.log(`[fetch-saas] Saved ${products.length} products for ${today}.`);

  return data;
}

// Allow running directly: node scripts/fetch-saas.js
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  fetchSaaS().catch((err) => {
    console.error('[fetch-saas] Unexpected error:', err);
    process.exit(1);
  });
}
