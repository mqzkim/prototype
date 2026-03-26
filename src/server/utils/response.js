/**
 * Send a JSON response
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {object} data
 */
export function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Send a JSON error response
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string|null} [code]
 */
export function sendError(res, statusCode, message, code = null) {
  sendJSON(res, statusCode, {
    error: { message, code, status: statusCode },
  });
}

/**
 * Parse JSON body from incoming request
 * @param {import('http').IncomingMessage} req
 * @param {number} [maxBytes=1048576]
 * @returns {Promise<object>}
 */
export function parseBody(req, maxBytes = 1_048_576) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
