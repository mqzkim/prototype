/**
 * @typedef {Object} GenerateParams
 * @property {string} prompt - Text description of the video to generate
 * @property {string} [resolution='1080p'] - Video resolution: '720p', '1080p', '4k'
 * @property {number} [durationSec=5] - Duration in seconds (1-30)
 * @property {string} [provider] - Specific provider to use (e.g. 'kling', 'veo')
 * @property {string} [routingStrategy='best-value'] - Routing strategy
 */

/**
 * @typedef {Object} GenerateResponse
 * @property {string} id - Generation job ID
 * @property {string} status - Job status ('processing', 'completed', 'failed')
 * @property {string} provider - Provider used
 * @property {string} model - Model name
 * @property {number|null} estimatedCost - Estimated cost in USD
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} AnalyzeParams
 * @property {string} [videoUrl] - URL of the video to analyze
 * @property {string} [videoBase64] - Base64-encoded video data
 * @property {string} [prompt] - Analysis prompt
 * @property {string} [provider='gemini'] - Understanding provider
 */

/**
 * @typedef {Object} AnalyzeResponse
 * @property {string} id - Analysis job ID
 * @property {string} status - Job status
 * @property {string} provider - Provider used
 * @property {string} model - Model name
 */

/**
 * @typedef {Object} Model
 * @property {string} id - Provider ID
 * @property {string} name - Display name
 * @property {string} type - 'generation' or 'understanding'
 * @property {string[]} capabilities - List of capabilities
 * @property {string|null} maxResolution - Maximum resolution
 * @property {string} status - Provider status
 */

/**
 * @typedef {Object} CostComparison
 * @property {string} provider - Provider ID
 * @property {string} name - Display name
 * @property {number} rate - Cost per second
 * @property {number} total - Total cost for requested duration
 * @property {string} currency - Always 'USD'
 */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status - 'healthy' or 'degraded'
 * @property {number} uptime - Server uptime in seconds
 * @property {string} version - API version
 */

/**
 * @typedef {Object} UsageStats
 * @property {string} apiKey - Masked API key
 * @property {string} tier - Account tier
 * @property {{ totalRequests: number, totalCost: number, byEndpoint: object }} summary
 * @property {object[]} recentRecords
 */

export default {};
