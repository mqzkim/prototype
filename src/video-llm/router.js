/**
 * Video LLM Unified Router
 *
 * Single API interface that routes requests to the optimal video model
 * based on use case, budget, and quality requirements.
 *
 * Features:
 * - Smart routing: auto-selects best model per request
 * - Cost estimation: compares pricing across providers
 * - Fallback chain: retries with alternative if primary fails
 * - Capability matching: filters models by required features
 */
import { PROVIDERS, ROUTING_RULES, DEFAULT_OPTIONS } from './config.js';
import { VeoAdapter } from './adapters/veo.js';
import { KlingAdapter } from './adapters/kling.js';
import { GeminiAdapter } from './adapters/gemini.js';

export class VideoRouter {
  constructor(apiKeys = {}) {
    this.apiKeys = apiKeys;
    this.adapters = {};
    this._initAdapters();
  }

  _initAdapters() {
    const adapterMap = {
      veo: VeoAdapter,
      kling: KlingAdapter,
      gemini: GeminiAdapter,
    };

    for (const [id, AdapterClass] of Object.entries(adapterMap)) {
      if (this.apiKeys[id] && PROVIDERS[id]) {
        this.adapters[id] = new AdapterClass(PROVIDERS[id], this.apiKeys[id]);
      }
    }
  }

  /**
   * Generate a video using the best available model
   */
  async generate(params) {
    const opts = { ...DEFAULT_OPTIONS, ...params };
    const provider = this._selectProvider('generation', opts);

    if (!provider) {
      throw new Error('No suitable video generation provider available');
    }

    const adapter = this.adapters[provider.id];
    if (!adapter) {
      throw new Error(`Adapter not initialized for ${provider.id}. Check API key.`);
    }

    const costEstimate = adapter.estimateCost(opts.durationSec, opts.resolution);

    return {
      ...(await adapter.generateVideo(opts)),
      model: provider.name,
      costEstimate,
    };
  }

  /**
   * Analyze/understand a video using the best available model
   */
  async analyze(params) {
    const opts = { ...params };
    const provider = this._selectProvider('understanding', opts);

    if (!provider) {
      throw new Error('No suitable video understanding provider available');
    }

    const adapter = this.adapters[provider.id];
    if (!adapter) {
      throw new Error(`Adapter not initialized for ${provider.id}. Check API key.`);
    }

    return {
      ...(await adapter.analyzeVideo(opts)),
      model: provider.name,
    };
  }

  /**
   * Compare costs across all available providers
   */
  compareCosts(durationSec = 5, resolution = '1080p') {
    const results = [];
    for (const [id, config] of Object.entries(PROVIDERS)) {
      if (config.type !== 'generation') continue;
      const adapter = this.adapters[id] || { estimateCost: (d, r) => {
        const pricing = config.pricingPerSec;
        if (!pricing) return null;
        const rate = pricing[r] || pricing['1080p'] || Object.values(pricing)[0];
        return { cost: rate * d, rate };
      }};
      const estimate = adapter.estimateCost(durationSec, resolution);
      if (estimate) {
        results.push({
          provider: id,
          name: config.name,
          ...estimate,
          totalForDuration: estimate.cost,
        });
      }
    }
    return results.sort((a, b) => a.totalForDuration - b.totalForDuration);
  }

  /**
   * List all providers with their capabilities
   */
  listProviders(type = null) {
    return Object.values(PROVIDERS)
      .filter(p => !type || p.type === type)
      .map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        capabilities: p.capabilities,
        maxResolution: p.maxResolution,
        status: p.status,
        initialized: !!this.adapters[p.id],
      }));
  }

  /**
   * Select the best provider based on routing strategy and requirements
   */
  _selectProvider(type, opts) {
    const strategy = opts.routingStrategy || 'best-value';

    // If explicit provider requested, use it
    if (opts.provider && PROVIDERS[opts.provider]) {
      return PROVIDERS[opts.provider];
    }

    // Check routing rules
    const rule = ROUTING_RULES[strategy];
    if (rule) {
      const preferredId = rule[type];
      if (preferredId && PROVIDERS[preferredId] && this.adapters[preferredId]) {
        return PROVIDERS[preferredId];
      }
    }

    // Fallback: find any available provider of the right type
    const requiredCapability = opts.capability;
    for (const [id, config] of Object.entries(PROVIDERS)) {
      if (config.type !== type) continue;
      if (requiredCapability && !config.capabilities.includes(requiredCapability)) continue;
      if (this.adapters[id]) return config;
    }

    return null;
  }

  /**
   * Get a summary of the current router state
   */
  getStatus() {
    const initialized = Object.keys(this.adapters);
    const total = Object.keys(PROVIDERS).length;
    return {
      totalProviders: total,
      initializedProviders: initialized.length,
      providers: this.listProviders(),
      supportedStrategies: Object.keys(ROUTING_RULES),
    };
  }
}
