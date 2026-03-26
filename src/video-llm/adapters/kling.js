/**
 * Kling 3.0 Adapter
 * Best for: Motion quality, multi-shot, volume production, lowest cost
 */
import { BaseAdapter } from './base.js';

export class KlingAdapter extends BaseAdapter {
  constructor(config, apiKey) {
    super(config);
    this.apiKey = apiKey;
    this.baseUrl = config.apiBase;
  }

  async generateVideo({ prompt, resolution = '1080p', durationSec = 5, imageRef = null, mode = 'standard' }) {
    const endpoint = imageRef
      ? `${this.baseUrl}/images/generations`
      : `${this.baseUrl}/videos/text2video`;

    const body = {
      model_name: 'kling-v3',
      prompt,
      duration: String(Math.min(durationSec, this.config.maxLengthSec)),
      mode,
      ...(imageRef && { image: imageRef }),
      cfg_scale: 0.5,
      aspect_ratio: '16:9',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Kling API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return {
      provider: this.id,
      taskId: data.data?.task_id,
      status: 'processing',
      estimatedCost: this.estimateCost(durationSec, resolution),
    };
  }

  async checkStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/videos/text2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    const data = await response.json();
    const task = data.data;

    if (task?.task_status === 'succeed') {
      return {
        status: 'completed',
        videoUrl: task.task_result?.videos?.[0]?.url,
      };
    }
    if (task?.task_status === 'failed') {
      return { status: 'failed', error: task.task_status_msg };
    }
    return { status: 'processing' };
  }
}
