// SSR isolation check (m0-web-shell 4.2, W-06). Renders the SSR fixture of a development build
// many times at once, each request with its own marker and credentials, against a stub API, and
// fails if any response or API request shows another request's state or a credential.
// Usage: node ssr-checks/isolation.mjs <dist folder of a development build of public>
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist/public-dev');
const requests = 50;
const failures = [];
const apiCalls = [];

const api = createServer((req, res) => {
  const url = new URL(req.url, 'http://stub');
  const sawCredentials = Boolean(req.headers.authorization || req.headers.cookie);
  apiCalls.push({ path: url.pathname, marker: url.searchParams.get('marker'), sawCredentials });
  // Random latency interleaves the renders.
  setTimeout(() => {
    res.writeHead(url.pathname === '/api/_fixtures/echo' ? 200 : 404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ marker: url.searchParams.get('marker'), sawCredentials }));
  }, Math.random() * 50);
}).listen(0);
await new Promise((ok) => api.once('listening', ok));

const port = 4700 + Math.floor(Math.random() * 200);
const server = spawn(process.execPath, [join(dist, 'server/server.mjs')], {
  env: { ...process.env, PORT: String(port), NG_ALLOWED_HOSTS: 'localhost', HERALD_API_URL: `http://localhost:${api.address().port}` },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((ok, fail) => {
  server.stdout.on('data', (chunk) => String(chunk).includes('listening') && ok());
  server.once('exit', (code) => fail(new Error(`SSR server exited with ${code}`)));
});

const base = `http://localhost:${port}`;
const markerOf = (i) => `marker-${String(i).padStart(3, '0')}-request`;
const checks = (html) => Object.fromEntries([...html.replace(/<!--.*?-->/g, '').matchAll(/data-check="(\w+)"[^>]*>\s*([^<]*?)\s*</g)].map((m) => [m[1], m[2]]));

try {
  const responses = await Promise.all(
    Array.from({ length: requests }, async (_, i) => {
      const res = await fetch(`${base}/_fixtures/ssr?marker=${markerOf(i)}`, {
        headers: { cookie: `session=secret-${i}`, authorization: `Bearer user-${i}` },
      });
      return { i, status: res.status, html: await res.text() };
    }),
  );
  for (const { i, status, html } of responses) {
    const own = markerOf(i);
    const seen = checks(html);
    const foreign = [...new Set(html.match(/marker-\d{3}-request/g) ?? [])].filter((m) => m !== own);
    if (status !== 200) failures.push(`request ${i}: status ${status}`);
    if (seen.provider !== own) failures.push(`request ${i}: provider rendered ${seen.provider}`);
    if (seen.query !== own) failures.push(`request ${i}: query rendered ${seen.query}`);
    if (seen.credentials !== 'no') failures.push(`request ${i}: API saw credentials (${seen.credentials})`);
    if (foreign.length) failures.push(`request ${i}: contains other requests' markers ${foreign.join(', ')}`);
    if (/secret-|user-|fixture-secret/.test(html)) failures.push(`request ${i}: response contains a credential`);
  }
  const echo = apiCalls.filter((c) => c.path === '/api/_fixtures/echo');
  if (echo.length !== requests) failures.push(`API received ${echo.length} echo requests, expected ${requests}`);
  if (apiCalls.some((c) => c.sawCredentials)) failures.push(`API received credentials in ${apiCalls.filter((c) => c.sawCredentials).length} requests`);

  // Later public responses carry nothing from the earlier requests.
  for (const path of ['/', '/_fixtures/ssr']) {
    const html = await (await fetch(base + path)).text();
    if (/marker-\d{3}-request/.test(html)) failures.push(`later ${path} contains an earlier request's marker`);
  }
} finally {
  server.kill();
  api.close();
}

if (failures.length) {
  console.error(`SSR isolation: ${failures.length} failures\n${failures.slice(0, 20).join('\n')}`);
  process.exit(1);
}
console.log(`SSR isolation: ${requests} concurrent requests rendered only their own marker, provider and query data; the API received no credentials.`);
