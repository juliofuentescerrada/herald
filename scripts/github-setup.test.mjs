// The delivery tracking's labels and milestones (batch-delivery D-4): node --test scripts/github-setup.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { root } from './rules.mjs';

// A gh that fails, first on the PATH, so any call to GitHub would fail the run.
const fakeBin = mkdtempSync(join(tmpdir(), 'herald-github-setup-test-'));
after(() => rmSync(fakeBin, { recursive: true, force: true }));
writeFileSync(join(fakeBin, 'gh'), '#!/bin/sh\necho "gh must not be called in a dry run" >&2\nexit 9\n');
chmodSync(join(fakeBin, 'gh'), 0o755);

// covers: delivery-tracking: A dry run
test('A dry run prints every label and milestone and calls no GitHub command', () => {
  const result = spawnSync(join(root, 'scripts', 'github-setup'), ['--dry-run'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split('\n');
  for (const line of lines) assert.match(line, /: \S.{10,}$/, `each line carries a description: ${line}`);
  const labels = lines.filter((line) => line.startsWith('label:')).map((line) => line.match(/'([^']+)'/)[1]);
  assert.deepEqual(labels, ['batch', 'slice', 'batch-proposals', 'needs-decision', 'in-progress', 'ready-to-test', 'feedback', 'agent:start']);
  const milestones = lines.filter((line) => line.startsWith('milestone:')).map((line) => line.match(/'([^']+)'/)[1]);
  assert.deepEqual(milestones, ['H1 Operator league', 'M4 Cloud', 'H2 Participant portal']);
});

test('An unknown argument prints the usage and changes nothing', () => {
  const result = spawnSync(join(root, 'scripts', 'github-setup'), ['--dry' + 'run'], { encoding: 'utf8', env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` } });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: scripts\/github-setup \[--dry-run\]/);
});

test('A real run updates an existing milestone instead of creating a second one, and can run again', () => {
  // A gh that records its calls and knows one existing milestone.
  const recorder = mkdtempSync(join(tmpdir(), 'herald-github-setup-recorder-'));
  after(() => rmSync(recorder, { recursive: true, force: true }));
  const log = join(recorder, 'calls.log');
  writeFileSync(
    join(recorder, 'gh'),
    `#!/bin/sh\necho "$*" >> '${log}'\nif echo "$*" | grep -q -- --paginate; then printf '7\\tH1 Operator league\\n'; fi\nexit 0\n`,
  );
  chmodSync(join(recorder, 'gh'), 0o755);
  const run = () => spawnSync(join(root, 'scripts', 'github-setup'), [], { encoding: 'utf8', env: { ...process.env, PATH: `${recorder}:${process.env.PATH}` } });

  for (let time = 0; time < 2; time++) {
    if (existsSync(log)) rmSync(log);
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const calls = readFileSync(log, 'utf8').trim().split('\n');
    assert.equal(calls.filter((call) => call.startsWith('label create')).length, 8);
    assert.ok(calls.every((call) => !call.startsWith('label create') || call.includes('--force')), 'labels are created or updated');
    assert.deepEqual(calls.filter((call) => call.includes('-X PATCH')).map((call) => call.split(' ')[3]), ['repos/{owner}/{repo}/milestones/7']);
    const created = calls.filter((call) => call.includes('-X POST')).map((call) => call.match(/title=(.+?) -f/)[1]);
    assert.deepEqual(created, ['M4 Cloud', 'H2 Participant portal']);
  }
});
