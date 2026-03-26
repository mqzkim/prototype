/**
 * Video LLM SaaS - Configuration
 *
 * Unified configuration for all supported video generation & understanding models.
 * Each provider defines its capabilities, pricing, and API details.
 */

export const PROVIDERS = {
  veo: {
    id: 'veo',
    name: 'Google Veo 3.1',
    type: 'generation',
    capabilities: ['text-to-video', 'image-to-video', 'audio-sync'],
    maxResolution: '4K',
    maxLengthSec: 20,
    pricingPerSec: { '720p': 0.15, '1080p': 0.20, '4k': 0.40, '4k_audio': 0.60 },
    apiBase: 'https://generativelanguage.googleapis.com/v1beta',
    authType: 'api_key',
    status: 'active',
  },
  kling: {
    id: 'kling',
    name: 'Kling 3.0',
    type: 'generation',
    capabilities: ['text-to-video', 'image-to-video', 'multi-shot'],
    maxResolution: '4K',
    maxLengthSec: 15,
    pricingPerSec: { '720p': 0.01, '1080p': 0.02, '4k': 0.03 },
    apiBase: 'https://api.klingai.com/v1',
    authType: 'api_key',
    status: 'active',
  },
  seedance: {
    id: 'seedance',
    name: 'Seedance 2.0',
    type: 'generation',
    capabilities: ['text-to-video', 'audio-sync', 'cinema-quality'],
    maxResolution: '1080p',
    maxLengthSec: 10,
    pricingPerSec: { '720p': 0.03, '1080p': 0.05 },
    apiBase: 'https://api.seedance.ai/v1',
    authType: 'api_key',
    status: 'active',
  },
  runway: {
    id: 'runway',
    name: 'Runway Gen-4.5',
    type: 'generation',
    capabilities: ['text-to-video', 'image-to-video', 'video-to-video'],
    maxResolution: '1080p',
    maxLengthSec: 10,
    pricingPerSec: { '720p': 0.06, '1080p': 0.10 },
    apiBase: 'https://api.dev.runwayml.com/v1',
    authType: 'bearer',
    status: 'active',
  },
  hunyuan: {
    id: 'hunyuan',
    name: 'HunyuanVideo 1.5',
    type: 'generation',
    capabilities: ['text-to-video', 'image-to-video', 'avatar', 'lora'],
    maxResolution: '1080p',
    maxLengthSec: 10,
    pricingPerSec: { self_hosted: 0 },
    selfHosted: true,
    vramRequired: '14GB+',
    status: 'active',
  },
  wan: {
    id: 'wan',
    name: 'Wan 2.2',
    type: 'generation',
    capabilities: ['text-to-video', 'cinema-look'],
    maxResolution: '720p',
    maxLengthSec: 10,
    pricingPerSec: { '720p': 0.05, '1080p': 0.10 },
    selfHosted: true,
    vramRequired: '8GB+',
    status: 'active',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini 3 Pro',
    type: 'understanding',
    capabilities: ['video-qa', 'video-captioning', 'temporal-reasoning', 'audio-analysis'],
    benchmark: { videoMME: 84.8 },
    pricingPerMTok: { input: 2.00, output: 12.00 },
    apiBase: 'https://generativelanguage.googleapis.com/v1beta',
    authType: 'api_key',
    status: 'active',
  },
  gpt4o: {
    id: 'gpt4o',
    name: 'GPT-4o',
    type: 'understanding',
    capabilities: ['video-qa', 'frame-analysis', 'multimodal-reasoning'],
    pricingPerMTok: { input: 0.25, output: 2.00 },
    apiBase: 'https://api.openai.com/v1',
    authType: 'bearer',
    status: 'active',
  },
};

export const ROUTING_RULES = {
  'best-quality': { generation: 'veo', understanding: 'gemini' },
  'best-value': { generation: 'kling', understanding: 'gpt4o' },
  'best-motion': { generation: 'kling', understanding: 'gemini' },
  'self-hosted': { generation: 'hunyuan', understanding: null },
  'cinema': { generation: 'seedance', understanding: 'gemini' },
};

export const DEFAULT_OPTIONS = {
  resolution: '1080p',
  durationSec: 5,
  fps: 24,
  audioSync: false,
  routingStrategy: 'best-value',
};
