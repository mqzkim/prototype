/**
 * Zero-dependency HTTP router
 * Matches method + path, runs middleware chain, then handler
 */
export class Router {
  constructor() {
    /** @type {{ method: string, path: string, handler: Function }[]} */
    this.routes = [];
  }

  /**
   * Register a GET route
   * @param {string} path
   * @param {Function} handler
   */
  get(path, handler) {
    this.routes.push({ method: 'GET', path, handler });
  }

  /**
   * Register a POST route
   * @param {string} path
   * @param {Function} handler
   */
  post(path, handler) {
    this.routes.push({ method: 'POST', path, handler });
  }

  /**
   * Handle an incoming request
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   * @returns {Promise<boolean>} true if route matched
   */
  async handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const matchingPath = this.routes.filter((r) => r.path === pathname);
    if (matchingPath.length === 0) return false;
    const route = matchingPath.find((r) => r.method === req.method);
    if (!route) {
      const allowed = matchingPath.map((r) => r.method).join(', ');
      res.setHeader('Allow', allowed);
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Method not allowed', status: 405 } }));
      return true;
    }
    await route.handler(req, res);
    return true;
  }
}
