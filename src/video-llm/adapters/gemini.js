/**
 * Gemini 3 Pro Adapter - Video Understanding
 * Best for: Video QA, temporal reasoning, audio-visual analysis
 * VideoMME benchmark: 84.8% (SOTA)
 */
import { BaseAdapter } from './base.js';

export class GeminiAdapter extends BaseAdapter {
  constructor(config, apiKey) {
    super(config);
    this.apiKey = apiKey;
    this.baseUrl = config.apiBase;
  }

  async analyzeVideo({ videoUrl, videoBase64, mimeType = 'video/mp4', prompt, mediaResolution = 'medium' }) {
    const model = 'gemini-3-pro';
    const endpoint = `${this.baseUrl}/models/${model}:generateContent`;

    const videoPart = videoUrl
      ? { fileData: { fileUri: videoUrl, mimeType } }
      : { inlineData: { data: videoBase64, mimeType } };

    const body = {
      contents: [{
        parts: [
          videoPart,
          { text: prompt || 'Describe this video in detail.' },
        ],
      }],
      generationConfig: {
        mediaResolution,
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    };

    const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return {
      provider: this.id,
      analysis: data.candidates?.[0]?.content?.parts?.[0]?.text,
      usage: data.usageMetadata,
    };
  }

  async uploadVideo(videoBuffer, mimeType = 'video/mp4') {
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: videoBuffer,
    });

    if (!response.ok) throw new Error('Video upload failed');
    const data = await response.json();
    return data.file?.uri;
  }
}
