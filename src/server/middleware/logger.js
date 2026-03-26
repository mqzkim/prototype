/**
 * Request logger middleware
 * Logs method, path, status, and duration to stdout
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export function logger(req, res) {
  req._startTime = Date.now();
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - req._startTime;
    const line = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
    process.stdout.write(`[api] ${line}\n`);
    return originalEnd(...args);
  };
}
