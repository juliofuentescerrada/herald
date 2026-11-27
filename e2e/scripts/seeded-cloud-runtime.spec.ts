import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from '../fixtures.ts';
import { scriptPersona, urls } from '../environment.ts';
import { capture, screen } from './screens.ts';

// The development server sends /api through proxy.conf.mjs, so the forwarding is checked on the built server,
// the server a slot runs (a development build of it: the forwarding code is the same), beside the suite's servers (m4-cloud-runtime 4.3).
const builtPort = 5485;
const built = `http://localhost:${builtPort}`;
let server: ChildProcess | undefined;

test.beforeAll(async () => {
  test.setTimeout(240_000);
  execFileSync('npx', ['ng', 'build', 'public', '--configuration', 'development', '--output-path', 'dist/public-script'], { cwd: '../web', stdio: 'inherit' });
  server = spawn(process.execPath, ['dist/public-script/server/server.mjs'], {
    cwd: '../web',
    env: { ...process.env, PORT: String(builtPort), NG_ALLOWED_HOSTS: 'localhost', HERALD_API_URL: urls.host, HERALD_ADMIN_URL: urls.admin },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise<void>((ok, fail) => {
    server!.stdout!.on('data', (chunk) => String(chunk).includes('listening') && ok());
    server!.once('exit', (code) => fail(new Error(`The built public server exited with ${code}`)));
  });
});

test.afterAll(() => {
  server?.kill();
});

// m4-cloud-runtime 4.3: the host without a broker answers its probes, and a seeded public page is served by the built
// public server, whose /api forwards the browser's request to the host.
test('The host runs without a broker and answers its probes, and the built public server forwards the browser\'s API request', async ({ page, browser, request, signIn }, info) => {
  const settings = JSON.parse(readFileSync('../src/Herald.Host/appsettings.E2E.json', 'utf8'));
  const probes = [];
  for (const path of ['/alive', '/health']) {
    const response = await request.get(`${urls.host}${path}`);
    expect(response.status()).toBe(200);
    probes.push(`GET ${path}\n${response.status()} ${await response.text()}`);
  }
  await capture(info, 'host-probes', `Herald:Messaging:Broker = ${settings.Herald.Messaging.Broker} (appsettings.E2E.json)\n\n${probes.join('\n\n')}\n`);

  // The seeded final league's public address, from "View public page".
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Arch' }).click();
  const href = await page.getByRole('region', { name: 'Visibility' }).getByRole('link', { name: 'View public page' }).getAttribute('href');
  const { pathname } = new URL(href!);
  const tournamentId = pathname.split('/').pop()!;

  const visitor = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await visitor.goto(`${built}${pathname}`);
  await expect(visitor.getByRole('heading', { name: 'Lantern Arch', level: 1 })).toBeVisible();
  await screen(visitor, info, 'public-page-on-the-built-server');

  // The browser's own request to its origin's /api reaches the host through the forwarding.
  const forwarded = await visitor.evaluate(async (id) => {
    const response = await fetch(`/api/public/tournaments/${id}`);
    return { status: response.status, type: response.headers.get('content-type'), body: await response.text() };
  }, tournamentId);
  expect(forwarded.status).toBe(200);
  expect(forwarded.body).toContain('Lantern Arch');
  await capture(info, 'forwarded-api-request', `GET ${built}/api/public/tournaments/${tournamentId}\n${forwarded.status} ${forwarded.type}\n\n${forwarded.body.slice(0, 600)}\n`);
});
