/**
 * Base Adapter - Abstract interface for all video LLM providers
 */
export class BaseAdapter {
  constructor(config) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
  }

  async generateVideo(_params) {
    throw new Error(`generateVideo not implemented for ${this.id}`);
  }

  async analyzeVideo(_params) {
    throw new Error(`analyzeVideo not implemented for ${this.id}`);
  }

  estimateCost(durationSec, resolution) {
    const pricing = this.config.pricingPerSec;
    if (!pricing) return null;
    const rate = pricing[resolution] || pricing['1080p'] || Object.values(pricing)[0];
    return { cost: rate * durationSec, currency: 'USD', rate, unit: 'per_second' };
  }

  getCapabilities() {
    return this.config.capabilities || [];
  }

  supports(capability) {
    return this.getCapabilities().includes(capability);
  }

  getStatus() {
    return this.config.status || 'unknown';
  }
}
