import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Tracks API usage per key, persisted to data/usage-log.json
 */
export class UsageTracker {
  /**
   * @param {string} dataDir - Path to data/ directory
   */
  constructor(dataDir) {
    this.filePath = join(dataDir, 'usage-log.json');
    this._writeQueue = Promise.resolve();
  }

  /**
   * Record a usage event (non-blocking)
   * @param {{ apiKey: string, endpoint: string, provider?: string, estimatedCost?: number, status: string, durationMs: number }} record
   */
  async record(record) {
    this._writeQueue = this._writeQueue.then(async () => {
      const data = await this._load();
      data.records.push({
        ...record,
        timestamp: new Date().toISOString(),
      });
      await writeFile(this.filePath, JSON.stringify(data, null, 2) + '\n');
    }).catch(() => {});
  }

  /**
   * Get usage records for a specific API key
   * @param {string} apiKey
   * @param {{ from?: string, to?: string }} [range]
   * @returns {Promise<object[]>}
   */
  async getUsage(apiKey, range = {}) {
    const data = await this._load();
    let records = data.records.filter((r) => r.apiKey === apiKey);
    if (range.from) {
      records = records.filter((r) => r.timestamp >= range.from);
    }
    if (range.to) {
      records = records.filter((r) => r.timestamp <= range.to);
    }
    return records;
  }

  /**
   * Get aggregated usage stats for an API key
   * @param {string} apiKey
   * @returns {Promise<{ totalRequests: number, totalCost: number, byEndpoint: object }>}
   */
  async getAggregated(apiKey) {
    const records = await this.getUsage(apiKey);
    const byEndpoint = {};
    let totalCost = 0;
    for (const r of records) {
      byEndpoint[r.endpoint] = (byEndpoint[r.endpoint] || 0) + 1;
      totalCost += r.estimatedCost || 0;
    }
    return { totalRequests: records.length, totalCost, byEndpoint };
  }

  /** @private */
  async _load() {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return { records: [] };
    }
  }
}
