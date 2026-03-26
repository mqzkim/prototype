/**
 * Video LLM SaaS - Public API
 *
 * Unified interface for video generation and understanding.
 *
 * Usage:
 *   import { createVideoRouter, PROVIDERS } from './video-llm/index.js';
 *
 *   const router = createVideoRouter({
 *     veo: 'your-google-api-key',
 *     kling: 'your-kling-api-key',
 *     gemini: 'your-gemini-api-key',
 *   });
 *
 *   // Generate video (auto-selects best model)
 *   const result = await router.generate({
 *     prompt: 'A cat playing piano in a jazz club',
 *     resolution: '1080p',
 *     durationSec: 5,
 *     routingStrategy: 'best-value', // or 'best-quality', 'cinema', etc.
 *   });
 *
 *   // Analyze video
 *   const analysis = await router.analyze({
 *     videoUrl: 'https://...',
 *     prompt: 'What is happening in this video?',
 *   });
 *
 *   // Compare costs
 *   const costs = router.compareCosts(10, '1080p');
 */

export { VideoRouter } from './router.js';
export { PROVIDERS, ROUTING_RULES, DEFAULT_OPTIONS } from './config.js';
export { BaseAdapter } from './adapters/base.js';
export { VeoAdapter } from './adapters/veo.js';
export { KlingAdapter } from './adapters/kling.js';
export { GeminiAdapter } from './adapters/gemini.js';

export function createVideoRouter(apiKeys) {
  return new VideoRouter(apiKeys);
}
