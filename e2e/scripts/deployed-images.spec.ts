import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { audience, authority, databaseConnectionString, scriptPersona, tenantId } from '../environment.ts';
import { capture, screen } from './screens.ts';

// m4-images 4.3: the four images, built by deploy/images/build, started against this run's database and provider: the host's
// image answers its probes, the seed image finds the seeded scenarios, the public image renders through the host's image,
// and the admin image writes its stub configuration and forwards /api/ to the host's image.
const ports = { api: 5485, public: 5486, admin: 5487 } as const;
const docker = (...args: string[]) => execFileSync('docker', args, { encoding: 'utf8' }).trim();
const env = (values: Record<string, string>) => Object.entries(values).flatMap(([name, value]) => ['-e', `${name}=${value}`]);
const started: string[] = [];
const start = (...args: string[]) => started.push(docker('run', '-d', ...args));

const until = async (url: string) => {
  await expect.poll(async () => (await fetch(url).catch(() => undefined))?.status, { timeout: 60_000 }).toBe(200);
};

test.afterAll(() => {
  for (const id of started) docker('rm', '-f', id);
});

test("Herald's four images start, seed, render the public site and serve the admin's configuration", async ({ page }, info) => {
  // The host's image, in the end-to-end environment, beside the host the run already started.
  start('--network', 'host', ...env({
    ASPNETCORE_ENVIRONMENT: 'E2E',
    ASPNETCORE_HTTP_PORTS: String(ports.api),
    ConnectionStrings__herald: databaseConnectionString,
    Herald__Authentication__Authority: authority,
    Herald__Authentication__Audience: audience,
  }), 'herald-api:local');
  const api = `http://localhost:${ports.api}`;
  await until(`${api}/health`);
  const alive = await fetch(`${api}/alive`);
  const health = await fetch(`${api}/health`);
  await capture(info, 'api-probes', `GET /alive  ${alive.status} ${await alive.text()}\nGET /health ${health.status} ${await health.text()}\n`);

  // The seed image against the seeded database: every scenario is already present.
  const seeded = docker('run', '--rm', '--network', 'host', ...env({
    ConnectionStrings__herald: databaseConnectionString,
    Herald__Seed__Personas__Main__DirectoryId: tenantId,
    Herald__Seed__Personas__Main__ObjectId: scriptPersona.oid,
    Herald__Seed__Personas__Main__Name: scriptPersona.name,
  }), 'herald-seed:local');
  expect(seeded).toContain('already present');
  await capture(info, 'seed-output', `${seeded}\n`);

  // The public image, reading through the host's image.
  start('--network', 'host', ...env({ PORT: String(ports.public), HERALD_API_URL: api, NG_ALLOWED_HOSTS: 'localhost' }), 'herald-public:local');
  await until(`http://localhost:${ports.public}/`);
  const home = await fetch(`http://localhost:${ports.public}/`);
  await capture(info, 'public-home', `GET / ${home.status} ${home.headers.get('content-type')}\n\n${(await home.text()).slice(0, 2000)}\n`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`http://localhost:${ports.public}/`);
  await expect(page.locator('body')).not.toBeEmpty();
  await screen(page, info, 'public-home');

  // The admin image with stub configuration, forwarding /api/ to the host's image.
  const stub = {
    HERALD_AUTH_AUTHORITY: 'https://login.example/stub-directory',
    HERALD_AUTH_CLIENT_ID: 'stub-admin-client',
    HERALD_AUTH_API_SCOPE: 'api://stub/access_as_user',
    HERALD_PUBLIC_URL: `http://localhost:${ports.public}`,
  };
  start('-p', `${ports.admin}:8080`, '--add-host', 'host.docker.internal:host-gateway',
    ...env({ ...stub, HERALD_API_URL: `http://host.docker.internal:${ports.api}` }), 'herald-admin:local');
  const admin = `http://localhost:${ports.admin}`;
  await until(`${admin}/runtime-config.json`);
  const config = await (await fetch(`${admin}/runtime-config.json`)).json();
  expect(config).toEqual({ authority: stub.HERALD_AUTH_AUTHORITY, clientId: stub.HERALD_AUTH_CLIENT_ID, apiScope: stub.HERALD_AUTH_API_SCOPE, publicUrl: stub.HERALD_PUBLIC_URL });
  // An unknown tournament: the host's own answer, not nginx's, shows the forwarding.
  const forwarded = await fetch(`${admin}/api/public/tournaments/00000000-0000-0000-0000-000000000000`);
  expect(forwarded.headers.get('content-type')).toContain('application/problem+json');
  await capture(info, 'admin-runtime-config', `GET /runtime-config.json\n${JSON.stringify(config, null, 2)}\n\nGET /api/public/tournaments/<unknown> ${forwarded.status} ${forwarded.headers.get('content-type')}\n`);
});
