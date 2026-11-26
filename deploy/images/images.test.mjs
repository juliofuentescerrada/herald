// Inspects the four images built locally or by CI's images job (m4-images D-5). Build them first:
//   docker build -f deploy/images/<name>/Dockerfile -t herald-<name>:local .   (after dotnet publish and pnpm build)
//   node --test deploy/images/images.test.mjs      HERALD_IMAGE_TAG overrides `local`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const tag = process.env.HERALD_IMAGE_TAG ?? 'local';
const image = (name) => `herald-${name}:${tag}`;
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();
const files = (name, dir) => docker('run', '--rm', '--entrypoint', 'ls', image(name), dir).split('\n');

const adminEnv = {
  HERALD_AUTH_AUTHORITY: 'https://login.example/directory',
  HERALD_AUTH_CLIENT_ID: 'stub-client',
  HERALD_AUTH_API_SCOPE: 'api://stub/access_as_user',
  HERALD_PUBLIC_URL: 'https://public.example',
  HERALD_API_URL: 'http://127.0.0.1:9',
};
const envArgs = (env) => Object.entries(env).flatMap(([name, value]) => ['-e', `${name}=${value}`]);

// covers: container-images: Every image runs as a non-root user
test('every image runs its entry point as a non-root user', () => {
  for (const name of ['api', 'seed', 'public', 'admin']) {
    const uid = docker('run', '--rm', '--entrypoint', 'id', image(name), '-u');
    assert.notEqual(uid, '0', `${name} runs as root`);
  }
});

// covers: container-images: The seeding tool is absent from the host's image
test("the host's image has no seeding or test assembly, the seed image has both", () => {
  const api = files('api', '/app');
  const seed = files('seed', '/app');
  assert.ok(api.includes('Herald.Host.dll'));
  for (const assembly of ['Herald.Seed.dll', 'Herald.Testing.dll']) {
    assert.ok(!api.includes(assembly), `api contains ${assembly}`);
    assert.ok(seed.includes(assembly), `seed lacks ${assembly}`);
  }
});

// covers: container-images: The admin container writes its configuration at start
test('the admin container serves runtime-config.json from its environment, and the image holds none', async () => {
  assert.equal(spawnSync('docker', ['run', '--rm', '--entrypoint', 'sh', image('admin'), '-c', 'find / -name runtime-config.json -not -path "/proc/*" | grep -q .']).status, 1);

  const id = docker('run', '-d', '-p', '127.0.0.1::8080', ...envArgs(adminEnv), image('admin'));
  try {
    const port = docker('port', id, '8080').split(':').pop();
    let response;
    for (let attempt = 0; attempt < 30 && !response?.ok; attempt++) {
      response = await fetch(`http://127.0.0.1:${port}/runtime-config.json`).catch(() => undefined);
      if (!response?.ok) await delay(500);
    }
    assert.deepEqual(await response.json(), {
      authority: adminEnv.HERALD_AUTH_AUTHORITY,
      clientId: adminEnv.HERALD_AUTH_CLIENT_ID,
      apiScope: adminEnv.HERALD_AUTH_API_SCOPE,
      publicUrl: adminEnv.HERALD_PUBLIC_URL,
    });
  } finally {
    docker('rm', '-f', id);
  }
});

// covers: container-images: A missing value stops the admin container
test('the admin container stops, naming the variable, without its client id', () => {
  const { HERALD_AUTH_CLIENT_ID, ...rest } = adminEnv;
  const run = spawnSync('docker', ['run', '--rm', ...envArgs(rest), image('admin')], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /HERALD_AUTH_CLIENT_ID is not set/);
});
