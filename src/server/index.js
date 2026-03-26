import { createServer as httpCreateServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from './router.js';
import { cors } from './middleware/cors.js';
import { logger } from './middleware/logger.js';
import { auth } from './middleware/auth.js';
import { rateLimit } from './middleware/rate-limit.js';
import { getTierConfig } from './utils/api-keys.js';
import { sendError } from './utils/response.js';
import { UsageTracker } from './utils/usage-tracker.js';
import { healthHandler } from './routes/health.js';
import { modelsHandler } from './routes/models.js';
import { costsHandler } from './routes/costs.js';
import { generateHandler } from './routes/generate.js';
import { analyzeHandler } from './routes/analyze.js';
import { usageHandler } from './routes/usage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Create the Video LLM SaaS API server
 * @param {{ dataDir?: string, port?: number }} [options]
 * @returns {{ server: import('http').Server, listen: (port?: number) => Promise<void>, close: () => Promise<void> }}
 */
export function createServer(options = {}) {
  const dataDir = options.dataDir || join(__dirname, '..', '..', 'data');
  const usageTracker = new UsageTracker(dataDir);
  const ctx = { usageTracker };

  const router = new Router();
  router.get('/v1/health', healthHandler);
  router.get('/v1/models', modelsHandler);
  router.get('/v1/costs', costsHandler);
  router.post('/v1/generate', (req, res) => generateHandler(req, res, ctx));
  router.post('/v1/analyze', (req, res) => analyzeHandler(req, res, ctx));
  router.get('/v1/usage', (req, res) => usageHandler(req, res, ctx));

  const noAuthPaths = new Set(['/v1/health']);

  const server = httpCreateServer(async (req, res) => {
    try {
      if (cors(req, res)) return;
      logger(req, res);
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (!noAuthPaths.has(url.pathname)) {
        const authed = await auth(req, res, dataDir);
        if (!authed) return;
        const tierConfig = await getTierConfig(dataDir, req.tier);
        const limited = rateLimit(req, res, tierConfig);
        if (!limited) return;
      }
      const matched = await router.handle(req, res);
      if (!matched) {
        sendError(res, 404, 'Not found', 'NOT_FOUND');
      }
    } catch (err) {
      sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
    }
  });

  return {
    server,
    listen: (port) => new Promise((resolve) => {
      server.listen(port || options.port || 3000, () => resolve());
    }),
    close: () => new Promise((resolve) => {
      server.close(() => resolve());
    }),
  };
}

/**
 * Start the server (production entry point)
 */
async function main() {
  const port = Number(process.env.PORT) || 3000;
  const app = createServer({ port });
  await app.listen(port);
  process.stdout.write(`[server] Video LLM SaaS API running on port ${port}\n`);
}

if (process.argv[1] && process.argv[1].includes('server/index.js')) {
  main();
}
