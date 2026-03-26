/**
 * Validate parameters for video generation
 * @param {object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateGenerateParams(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }
  if (!body.prompt || typeof body.prompt !== 'string') {
    errors.push('prompt is required and must be a string');
  }
  if (body.resolution && !['720p', '1080p', '4k'].includes(body.resolution)) {
    errors.push('resolution must be one of: 720p, 1080p, 4k');
  }
  if (body.durationSec !== undefined) {
    const d = Number(body.durationSec);
    if (isNaN(d) || d < 1 || d > 30) {
      errors.push('durationSec must be a number between 1 and 30');
    }
  }
  if (body.routingStrategy && typeof body.routingStrategy !== 'string') {
    errors.push('routingStrategy must be a string');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate parameters for video analysis
 * @param {object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAnalyzeParams(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }
  if (!body.videoUrl && !body.videoBase64) {
    errors.push('videoUrl or videoBase64 is required');
  }
  if (body.videoUrl && typeof body.videoUrl !== 'string') {
    errors.push('videoUrl must be a string');
  }
  if (body.videoBase64 && typeof body.videoBase64 !== 'string') {
    errors.push('videoBase64 must be a string');
  }
  return { valid: errors.length === 0, errors };
}
