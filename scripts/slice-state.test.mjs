// The slice's state after a compaction or a resume (harness-resumption D-4): node --test scripts/slice-state.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { root } from './rules.mjs';
import { sliceState } from './slice-state.mjs';

const temp = mkdtempSync(join(tmpdir(), 'herald-slice-state-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));

const repository = (name, { approved }) => {
  const repo = join(temp, name);
  const change = join(repo, 'openspec', 'changes', 'some-slice');
  mkdirSync(join(repo, 'openspec', 'changes', 'archive', 'old'), { recursive: true });
  mkdirSync(change, { recursive: true });
  writeFileSync(join(change, 'proposal.md'), approved ? '## Status\n\n**Approved for implementation on 1 January 2027**\n' : '## Status\n\nPending.\n');
  writeFileSync(join(change, 'tasks.md'), '## 1. Approval\n\n- [x] 1.1 Approve\n\n## 2. Work\n\n- [x] 2.1 First\n- [ ] 2.2 Second\n- [ ] 2.3 Third\n');
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, CLAUDECODE: '' } });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.org');
  git('config', 'user.name', 'Test');
  git('config', 'commit.gpgsign', 'false');
  git('commit', '-q', '--allow-empty', '-m', 'start');
  git('checkout', '-q', '-b', 'slice');
  git('add', '-A');
  git('commit', '-q', '-m', 'feat(some-slice): 2.1 first');
  return repo;
};

// covers: agent-harness: Reading the state of a branch with checkpoints
test('The state names the approved change, its first unchecked task and the last checkpoint', () => {
  const state = sliceState(repository('approved', { approved: true }));
  assert.match(state, /Branch: slice/);
  assert.match(state, /Change some-slice: approved for implementation, 2\/4 tasks done/);
  assert.match(state, /next: 2\.2 Second\n {2}- next: 2\.3 Third/);
  assert.match(state, /Last checkpoint: [0-9a-f]+ feat\(some-slice\): 2\.1 first/);
  assert.doesNotMatch(state, /old/, 'archived changes are not active');
});

test('A fresh clone on the base points to the remote branch that holds the checkpoints', () => {
  const origin = repository('origin', { approved: true });
  const clone = join(temp, 'clone');
  execFileSync('git', ['clone', '-q', '--branch', 'main', origin, clone], { encoding: 'utf8' });
  const state = sliceState(clone);
  assert.match(state, /Last checkpoint: none on this branch since origin\/main/);
  assert.match(state, /Checkpoints on origin\/slice \(last: [0-9a-f]+ feat\(some-slice\): 2\.1 first\)/);
});

test('A change without approval is shown as such', () => {
  assert.match(sliceState(repository('pending', { approved: false })), /Change some-slice: NOT approved yet/);
});

// covers: agent-harness: The context is compacted during a slice
test('Claude Code runs the state after a compaction and on resume', () => {
  const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
  const entries = settings.hooks.SessionStart ?? [];
  const entry = entries.find((candidate) => candidate.hooks.some((hook) => hook.command.includes('scripts/slice-state.mjs')));
  assert.ok(entry, 'a SessionStart hook runs scripts/slice-state.mjs');
  assert.deepEqual(entry.matcher.split('|').sort(), ['compact', 'resume']);
});
