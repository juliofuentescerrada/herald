import type { RequestHandler } from 'express';
import { Readable, pipeline } from 'node:stream';

// The connection's headers, not the request's (RFC 9110 §7.6.1); fetch sets its own host and length.
const hopByHop = new Set(['connection', 'keep-alive', 'proxy-connection', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length']);

/**
 * Forwards the browser's `/api/*` requests to the Herald API unchanged, so the API's ingress stays internal
 * (m4-cloud-runtime D-5). The server's own rendering does not come through here: it calls the API directly (W-05).
 */
export function forwardApi(apiUrl: string | undefined): RequestHandler {
  return async (req, res, next) => {
    if (!apiUrl) {
      next(new Error('HERALD_API_URL is not set: the server cannot forward to the Herald API.'));
      return;
    }
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined && !hopByHop.has(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const response = await fetch(new URL(req.originalUrl, apiUrl), {
        method: req.method,
        headers,
        body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
        redirect: 'manual',
        // Required by Node's fetch for a streamed request body.
        duplex: 'half',
      } as RequestInit);

      res.status(response.status);
      response.headers.forEach((value, name) => {
        // fetch has already decoded the body, so its encoding and length no longer apply.
        if (!hopByHop.has(name) && name !== 'content-encoding' && name !== 'set-cookie') res.setHeader(name, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) res.setHeader('set-cookie', cookies);
      // pipeline destroys the response if the API's stream fails part-way, so the browser is not left waiting.
      if (response.body) pipeline(Readable.fromWeb(response.body as never), res, () => undefined);
      else res.end();
    } catch (error) {
      next(error);
    }
  };
}
