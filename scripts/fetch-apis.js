import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const DATA_PATH = join(ROOT, 'data', 'api-data.json');

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'prototype-dashboard/1.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${url}: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

function loadData() {
  const raw = readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function fetchExchangeRates() {
  try {
    const json = await httpsGet('https://open.er-api.com/v6/latest/USD');
    const rates = json.rates || {};
    return {
      usd_krw: rates.KRW ?? null,
      usd_jpy: rates.JPY ?? null,
      usd_eur: rates.EUR ?? null,
    };
  } catch (err) {
    console.warn(`[fetch-apis] Exchange rate fetch failed: ${err.message}`);
    return { usd_krw: null, usd_jpy: null, usd_eur: null };
  }
}

async function fetchWeather() {
  try {
    const json = await httpsGet('https://wttr.in/Seoul?format=j1');
    const current = json.current_condition?.[0] || {};
    return {
      temp_c: current.temp_C != null ? parseFloat(current.temp_C) : null,
      condition: current.weatherDesc?.[0]?.value ?? null,
    };
  } catch (err) {
    console.warn(`[fetch-apis] Weather fetch failed: ${err.message}`);
    return { temp_c: null, condition: null };
  }
}

export async function fetchAPIs() {
  const today = getToday();
  const data = loadData();

  // Idempotent: skip if today already has entries
  const exchangeExists = data.exchange.history.some((e) => e.date === today);
  const weatherExists = data.weather.history.some((e) => e.date === today);

  if (exchangeExists && weatherExists) {
    console.log(`[fetch-apis] Data for ${today} already exists. Skipping.`);
    return data;
  }

  const [exchange, weather] = await Promise.all([
    exchangeExists ? Promise.resolve(null) : fetchExchangeRates(),
    weatherExists ? Promise.resolve(null) : fetchWeather(),
  ]);

  if (exchange) {
    data.exchange.history.push({
      date: today,
      usd_krw: exchange.usd_krw,
      usd_jpy: exchange.usd_jpy,
      usd_eur: exchange.usd_eur,
    });
  }

  if (weather) {
    data.weather.history.push({
      date: today,
      city: 'Seoul',
      temp_c: weather.temp_c,
      condition: weather.condition,
    });
  }

  data.last_fetched = today;
  saveData(data);
  console.log(`[fetch-apis] Updated data for ${today}.`);
  return data;
}

// Allow direct execution: node scripts/fetch-apis.js
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  fetchAPIs().catch((err) => {
    console.error(`[fetch-apis] Fatal error: ${err.message}`);
    process.exit(1);
  });
}
