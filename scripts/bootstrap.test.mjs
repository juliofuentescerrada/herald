// Running scripts/bootstrap twice (agent-harness): minutes long, so it runs only with HERALD_TEST_BOOTSTRAP=1, which
// the Bootstrap workflow sets on pull requests that change the bootstrap.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

// covers: agent-harness: Running the bootstrap twice
test('A second bootstrap reinstalls nothing current and leaves the git hooks enabled', { skip: process.env['HERALD_TEST_BOOTSTRAP'] !== '1' }, () => {
  const run = () => spawnSync(join(root, 'scripts/bootstrap'), { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const first = run();
  assert.equal(first.status, 0, first.stderr);

  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.doesNotMatch(second.stdout + second.stderr, /added \d+ packages?/, 'the second run installed a global tool again');
  assert.equal(execFileSync('git', ['config', 'core.hooksPath'], { cwd: root, encoding: 'utf8' }).trim(), '.githooks');
});
