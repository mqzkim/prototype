/** @typedef {import('./types.js').GenerateParams} GenerateParams */
/** @typedef {import('./types.js').GenerateResponse} GenerateResponse */
/** @typedef {import('./types.js').AnalyzeParams} AnalyzeParams */
/** @typedef {import('./types.js').Model} Model */
/** @typedef {import('./types.js').CostComparison} CostComparison */
/** @typedef {import('./types.js').HealthStatus} HealthStatus */
/** @typedef {import('./types.js').UsageStats} UsageStats */

/**
 * Video LLM SaaS Client SDK
 *
 * @example
 * import { createClient } from './src/client/index.js';
 * const client = createClient('http://localhost:3000', 'vllm_your_key');
 * const result = await client.generate({ prompt: 'A sunset over ocean', resolution: '1080p' });
 * const models = await client.listModels();
 * const costs = await client.compareCosts({ duration: 10, resolution: '4k' });
 */
export class VideoLLMClient {
  /**
   * @param {string} baseUrl - Server base URL (e.g. 'http://localhost:3000')
   * @param {string} apiKey - API key for authentication
   */
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  /**
   * Generate a video
   * @param {GenerateParams} params
   * @returns {Promise<GenerateResponse>}
   *
   * @example
   * const result = await client.generate({ prompt: 'A cat playing piano', durationSec: 5 });
   * console.log(result.id, result.estimatedCost);
   */
  async generate(params) {
    return this._request('POST', '/v1/generate', params);
  }

  /**
   * Analyze a video
   * @param {AnalyzeParams} params
   * @returns {Promise<import('./types.js').AnalyzeResponse>}
   *
   * @example
   * const result = await client.analyze({ videoUrl: 'https://example.com/video.mp4', prompt: 'What happens?' });
   */
  async analyze(params) {
    return this._request('POST', '/v1/analyze', params);
  }

  /**
   * List available models
   * @param {string} [type] - Filter by 'generation' or 'understanding'
   * @returns {Promise<{ models: Model[] }>}
   *
   * @example
   * const { models } = await client.listModels('generation');
   */
  async listModels(type) {
    const qs = type ? `?type=${type}` : '';
    return this._request('GET', `/v1/models${qs}`);
  }

  /**
   * Compare costs across providers
   * @param {{ duration?: number, resolution?: string }} [params]
   * @returns {Promise<{ costs: CostComparison[] }>}
   *
   * @example
   * const { costs } = await client.compareCosts({ duration: 10, resolution: '1080p' });
   */
  async compareCosts(params = {}) {
    const qs = new URLSearchParams();
    if (params.duration) qs.set('duration', String(params.duration));
    if (params.resolution) qs.set('resolution', params.resolution);
    const query = qs.toString();
    return this._request('GET', `/v1/costs${query ? '?' + query : ''}`);
  }

  /**
   * Check server health (no auth required)
   * @returns {Promise<HealthStatus>}
   *
   * @example
   * const health = await client.health();
   * console.log(health.status, health.uptime);
   */
  async health() {
    const res = await fetch(`${this.baseUrl}/v1/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  }

  /**
   * Get usage statistics for the authenticated key
   * @param {{ from?: string, to?: string }} [params]
   * @returns {Promise<UsageStats>}
   *
   * @example
   * const usage = await client.usage({ from: '2026-03-01' });
   */
  async usage(params = {}) {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const query = qs.toString();
    return this._request('GET', `/v1/usage${query ? '?' + query : ''}`);
  }

  /**
   * @private
   * @param {string} method
   * @param {string} path
   * @param {object} [body]
   * @returns {Promise<object>}
   */
  async _request(method, path, body = null) {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${this.baseUrl}${path}`, opts);
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || `Request failed: ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }
}

/**
 * Create a Video LLM client
 * @param {string} baseUrl
 * @param {string} apiKey
 * @returns {VideoLLMClient}
 *
 * @example
 * const client = createClient('http://localhost:3000', 'vllm_test_pro_001');
 */
export function createClient(baseUrl, apiKey) {
  return new VideoLLMClient(baseUrl, apiKey);
}
