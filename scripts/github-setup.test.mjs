// The delivery tracking's labels and milestones (batch-delivery D-4): node --test scripts/github-setup.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
  const labels = lines.filter((line) => line.startsWith('label:')).map((line) => line.match(/'([^']+)'/)[1]);
  assert.deepEqual(labels, ['batch', 'slice', 'batch-proposals', 'needs-decision', 'in-progress', 'ready-to-test', 'feedback', 'agent:start']);
  const milestones = lines.filter((line) => line.startsWith('milestone:')).map((line) => line.match(/'([^']+)'/)[1]);
  assert.deepEqual(milestones, ['H1 Operator league', 'M4 Cloud', 'H2 Participant portal']);
});
