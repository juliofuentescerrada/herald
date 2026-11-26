import express from 'express';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { forwardApi } from './api-forward';

const listen = async (server: Server) => {
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
};

describe('the public server forwarding /api', () => {
  let seen: { method?: string; url?: string; authorization?: string; body: string };
  let api: Server;
  let site: Server;
  let siteUrl: string;

  beforeEach(async () => {
    seen = { body: '' };
    api = createServer(async (req: IncomingMessage, res) => {
      for await (const chunk of req) seen.body += chunk;
      Object.assign(seen, { method: req.method, url: req.url, authorization: req.headers.authorization });
      res.writeHead(418, { 'content-type': 'application/json', 'x-from': 'api' });
      res.end(JSON.stringify({ from: 'api' }));
    });
    const app = express();
    app.use('/api', forwardApi(await listen(api)));
    site = createServer(app);
    siteUrl = await listen(site);
  });

  afterEach(() => {
    api.close();
    site.close();
  });

  it('passes the path, query and Authorization header, and returns the API status and body',
    { meta: { type: 'covers', description: 'cloud-runtime: A browser request to the public origin\'s API path' } }, async () => {
      const response = await fetch(`${siteUrl}/api/tournaments/t-1?view=public`, { headers: { Authorization: 'Bearer browser-token' } });

      expect(seen).toMatchObject({ method: 'GET', url: '/api/tournaments/t-1?view=public', authorization: 'Bearer browser-token' });
      expect(response.status).toBe(418);
      expect(response.headers.get('x-from')).toBe('api');
      expect(await response.json()).toEqual({ from: 'api' });
    });

  it('passes a request body unchanged', async () => {
    await fetch(`${siteUrl}/api/organisations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":"Club"}' });

    expect(seen).toMatchObject({ method: 'POST', url: '/api/organisations', body: '{"name":"Club"}' });
  });
});
