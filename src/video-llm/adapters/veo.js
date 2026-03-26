/**
 * Google Veo 3.1 Adapter
 * Best for: Photorealism, 4K, lip-sync, prompt adherence
 */
import { BaseAdapter } from './base.js';

export class VeoAdapter extends BaseAdapter {
  constructor(config, apiKey) {
    super(config);
    this.apiKey = apiKey;
    this.baseUrl = config.apiBase;
  }

  async generateVideo({ prompt, resolution = '1080p', durationSec = 5, imageRef = null, audioSync = false }) {
    const model = 'veo-3.1';
    const endpoint = `${this.baseUrl}/models/${model}:generateVideo`;

    const body = {
      instances: [{
        prompt,
        ...(imageRef && { image: { bytesBase64Encoded: imageRef } }),
      }],
      parameters: {
        aspectRatio: resolution === '4k' ? '16:9' : '16:9',
        durationSeconds: Math.min(durationSec, this.config.maxLengthSec),
        personGeneration: 'allow_all',
        generateAudio: audioSync,
      },
    };

    const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Veo API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return {
      provider: this.id,
      operationId: data.name,
      status: 'processing',
      estimatedCost: this.estimateCost(durationSec, audioSync ? '4k_audio' : resolution),
    };
  }

  async checkStatus(operationId) {
    const response = await fetch(
      `${this.baseUrl}/operations/${operationId}?key=${this.apiKey}`
    );
    const data = await response.json();

    if (data.done) {
      return {
        status: 'completed',
        videoUrl: data.response?.generatedSamples?.[0]?.video?.uri,
      };
    }
    return { status: 'processing' };
  }
}
