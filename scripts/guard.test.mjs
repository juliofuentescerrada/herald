// The loop guard's limits and metrics with synthetic hook inputs (ADR 0018, harness-engineering D-12).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { markdown, summarise, turnsOf } from './harness-metrics.mjs';

const temp = mkdtempSync(join(tmpdir(), 'herald-guard-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));
const guard = new URL('../.claude/hooks/guard.mjs', import.meta.url).pathname;

// A repository whose `slice` branch is ahead of origin/main: where the push-round tests run, so they never depend on
// the real repository's history (ci-path-filters D-5).
const sliceRepository = (name) => {
  const repo = join(temp, name);
  mkdirSync(repo, { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, CLAUDECODE: '' } }).trim();
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.org');
  git('config', 'user.name', 'Test');
  git('config', 'commit.gpgsign', 'false');
  git('commit', '-q', '--allow-empty', '--no-verify', '-m', 'main');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  git('checkout', '-q', '-b', 'slice');
  git('commit', '-q', '--allow-empty', '--no-verify', '-m', 'slice');
  return { repo, git };
};
const defaultRepository = sliceRepository('default-repository').repo;

const hook = (session, event, extra = {}, env = {}) => {
  const result = spawnSync(process.execPath, [guard], {
    input: JSON.stringify({ session_id: session, hook_event_name: event, ...extra }),
    env: { ...process.env, TMPDIR: temp, HERALD_GUARD: '', HERALD_GUARD_ROOT: defaultRepository, ...env },
    encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
};
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
const metrics = (session) => readFileSync(join(temp, 'herald-guard', `${session}.jsonl`), 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));

test('Each turn ends with one line of its tool calls, failures, pushes and duration', () => {
  hook('m1', 'UserPromptSubmit', { prompt: 'Implement the slice' });
  hook('m1', 'PreToolUse', bash('dotnet test'));
  hook('m1', 'PostToolUseFailure', { ...bash('dotnet test'), error: 'Exit code 1\nfailed' });
  hook('m1', 'PreToolUse', bash('git push -u origin b'));
  hook('m1', 'PostToolUse', bash('git push -u origin b'));
  assert.equal(hook('m1', 'Stop').code, 0);

  const [turn] = metrics('m1');
  assert.deepEqual({ turn: turn.turn, maintainer: turn.maintainer, tools: turn.tools, failures: turn.failures, pushes: turn.pushes }, { turn: 1, maintainer: true, tools: 2, failures: 1, pushes: 1 });
  assert.ok(turn.durationMs >= 0);
});

test('A turn started by a GitHub wake-up is recorded as not the maintainer and keeps the budget', () => {
  hook('m2', 'UserPromptSubmit', { prompt: 'Start' });
  hook('m2', 'PreToolUse', bash('ls'));
  hook('m2', 'Stop');
  hook('m2', 'UserPromptSubmit', { prompt: '<wake reason="external-event"><event source="github">ci</event></wake>' });
  hook('m2', 'PreToolUse', bash('ls'));
  hook('m2', 'Stop');

  const turns = metrics('m2');
  assert.deepEqual(turns.map((turn) => [turn.turn, turn.maintainer, turn.tools]), [[1, true, 1], [2, false, 1]]);
  const state = JSON.parse(readFileSync(join(temp, 'herald-guard', 'm2.json'), 'utf8'));
  assert.equal(state.tools, 2);
});

test('A command that failed three times in a row is refused', () => {
  for (let attempt = 0; attempt < 3; attempt++) {
    hook('m3', 'PreToolUse', bash('pnpm test'));
    hook('m3', 'PostToolUseFailure', { ...bash('pnpm test'), error: 'Exit code 1' });
  }
  assert.match(hook('m3', 'PreToolUse', bash('pnpm test')).stdout, /"permissionDecision":"deny"/);
});

// covers: agent-harness: A slice pull request
test('The pull request summary counts finished turns and the one still opening it', () => {
  hook('m4', 'UserPromptSubmit', { prompt: 'Start the slice' });
  hook('m4', 'PreToolUse', bash('dotnet build'));
  hook('m4', 'Stop');
  hook('m4', 'UserPromptSubmit', { prompt: '<wake reason="external-event"><event source="github">merged</event></wake>' });
  hook('m4', 'PreToolUse', bash('git push -u origin b'));
  hook('m4', 'PostToolUse', bash('git push -u origin b'));

  const totals = summarise(turnsOf('m4', join(temp, 'herald-guard')));
  assert.deepEqual({ turns: totals.turns, tools: totals.tools, pushes: totals.pushes }, { turns: 2, tools: 2, pushes: 1 });
  assert.match(markdown(['m4'], totals), /\| Pushes \| 1 \|/);
});

test('The summary adds the turns of a session up for the pull request', () => {
  const totals = summarise([
    JSON.stringify({ maintainer: true, tools: 10, failures: 1, pushes: 1, durationMs: 120000 }),
    JSON.stringify({ maintainer: false, tools: 5, failures: 0, pushes: 1, durationMs: 60000 }),
  ]);
  assert.deepEqual(totals, { turns: 2, maintainerTurns: 1, tools: 15, failures: 1, pushes: 2, minutes: 3 });
  assert.match(markdown(['s', 't'], totals), /\| Tool calls \| 15 \|/);
});

// covers: agent-harness: Pushing checkpoints before the pull request
test('Checkpoint pushes before a pull request opens do not use the push rounds', () => {
  hook('p1', 'UserPromptSubmit', { prompt: 'Implement the slice' });
  for (let task = 0; task < 5; task++) {
    const push = hook('p1', 'PreToolUse', bash('git push -u origin slice'));
    assert.doesNotMatch(push.stdout, /"permissionDecision":"deny"/);
    hook('p1', 'PostToolUse', bash('git push -u origin slice'));
  }
  hook('p1', 'Stop');
  assert.equal(metrics('p1')[0].pushes, 5);
});

// covers: agent-harness: Pushing after the pull request opens
test('Once the session opens a pull request, its pushes count towards the rounds', () => {
  hook('p2', 'UserPromptSubmit', { prompt: 'Implement the slice' });
  hook('p2', 'PreToolUse', bash('git push -u origin slice'));
  hook('p2', 'PostToolUse', bash('git push -u origin slice'));
  hook('p2', 'PreToolUse', { tool_name: 'mcp__github__create_pull_request', tool_input: {} });
  hook('p2', 'PostToolUse', { tool_name: 'mcp__github__create_pull_request', tool_input: {} });
  for (let round = 0; round < 3; round++) {
    assert.doesNotMatch(hook('p2', 'PreToolUse', bash('git push')).stdout, /deny/, 'the push before the pull request did not count');
    hook('p2', 'PostToolUse', bash('git push'));
  }
  assert.match(hook('p2', 'PreToolUse', bash('git push')).stdout, /"permissionDecision":"deny"/);
});

test('A session started by a merge event still pushes its checkpoints freely', () => {
  hook('p4', 'UserPromptSubmit', { prompt: '<wake reason="external-event"><event source="github">pull request merged</event></wake>' });
  for (let task = 0; task < 5; task++) {
    assert.doesNotMatch(hook('p4', 'PreToolUse', bash('git push -u origin slice')).stdout, /deny/);
    hook('p4', 'PostToolUse', bash('git push -u origin slice'));
  }
});

test('Opening the pull request with gh also starts counting', () => {
  hook('p5', 'UserPromptSubmit', { prompt: 'Implement the slice' });
  hook('p5', 'PreToolUse', bash('gh pr create --fill'));
  hook('p5', 'PostToolUse', bash('gh pr create --fill'));
  for (let round = 0; round < 3; round++) {
    hook('p5', 'PreToolUse', bash('git push'));
    hook('p5', 'PostToolUse', bash('git push'));
  }
  assert.match(hook('p5', 'PreToolUse', bash('git push')).stdout, /"permissionDecision":"deny"/);
});

test('A GitHub wake-up after the first turn means the session has a pull request', () => {
  hook('p3', 'UserPromptSubmit', { prompt: 'Implement the slice' });
  hook('p3', 'Stop');
  hook('p3', 'UserPromptSubmit', { prompt: '<wake reason="external-event"><event source="github">review</event></wake>' });
  for (let round = 0; round < 3; round++) {
    hook('p3', 'PreToolUse', bash('git push'));
    hook('p3', 'PostToolUse', bash('git push'));
  }
  assert.match(hook('p3', 'PreToolUse', bash('git push')).stdout, /"permissionDecision":"deny"/);
});

// A repository root with one active change, approved or not.
const repositoryWith = (name, proposal) => {
  const dir = join(temp, name);
  mkdirSync(join(dir, 'openspec', 'changes', 'a-change'), { recursive: true });
  mkdirSync(join(dir, 'openspec', 'changes', 'archive', 'old'), { recursive: true });
  writeFileSync(join(dir, 'openspec', 'changes', 'archive', 'old', 'proposal.md'), '**Approved for implementation on 1 January 2026**');
  writeFileSync(join(dir, 'openspec', 'changes', 'a-change', 'proposal.md'), proposal);
  return dir;
};
const edit = (path) => ({ tool_name: 'Edit', tool_input: { file_path: path } });

// covers: agent-harness: Editing production code before approval
test('Production code cannot be edited without an approved active change', () => {
  const root = repositoryWith('pending', '## Status\n\nPending the maintainer\'s review.');
  const env = { HERALD_GUARD_ROOT: root };
  for (const path of [join(root, 'src/Herald.Host/Program.cs'), 'web/projects/admin/src/main.ts', join(root, 'tools/Herald.Seed/Scenarios.cs')]) {
    const result = hook('f1', 'PreToolUse', edit(path), env);
    assert.match(result.stdout, /"permissionDecision":"deny"/, path);
    assert.match(result.stdout, /no approved change/);
  }
  for (const path of [join(root, 'tests/Some.Tests/A.cs'), join(root, 'e2e/journeys/a.spec.ts'), join(root, 'openspec/changes/a-change/tasks.md'), join(root, 'CLAUDE.md')]) {
    assert.doesNotMatch(hook('f1', 'PreToolUse', edit(path), env).stdout, /deny/, path);
  }
});

// covers: agent-harness: Editing production code with an approved change
test('A proposal that only mentions the phrase is not an approval', () => {
  const root = repositoryWith('mentions', '## Status\n\nPending.\n\nThe guard looks for "Approved for implementation" in a proposal.');
  assert.match(hook('f3', 'PreToolUse', edit(join(root, 'src/A.cs')), { HERALD_GUARD_ROOT: root }).stdout, /deny/);
});

test('Production code can be edited once an active change is approved', () => {
  const root = repositoryWith('approved', '## Status\n\n**Approved for implementation on 12 November 2026** (gate 1.1).');
  assert.doesNotMatch(hook('f2', 'PreToolUse', edit(join(root, 'src/Herald.Host/Program.cs')), { HERALD_GUARD_ROOT: root }).stdout, /deny/);
});

const openPullRequest = (session, env) => {
  hook(session, 'UserPromptSubmit', { prompt: 'Implement the slice' }, env);
  hook(session, 'PreToolUse', { tool_name: 'mcp__github__create_pull_request', tool_input: {} }, env);
  hook(session, 'PostToolUse', { tool_name: 'mcp__github__create_pull_request', tool_input: {} }, env);
  for (let round = 0; round < 3; round++) {
    hook(session, 'PreToolUse', bash('git push'), env);
    hook(session, 'PostToolUse', bash('git push'), env);
  }
};

// covers: agent-harness: A new change after the pull request merged
test('Once the pull request is merged, the next change pushes its checkpoints freely', () => {
  const { repo, git } = sliceRepository('merged');
  const env = { HERALD_GUARD_ROOT: repo };
  openPullRequest('r1', env);
  assert.match(hook('r1', 'PreToolUse', bash('git push'), env).stdout, /deny/, 'the rounds are spent while it is open');

  git('update-ref', 'refs/remotes/origin/main', 'slice');
  git('commit', '-q', '--allow-empty', '--no-verify', '-m', 'next change, task 1.1');
  for (let task = 0; task < 5; task++) {
    assert.doesNotMatch(hook('r1', 'PreToolUse', bash('git push'), env).stdout, /deny/);
    hook('r1', 'PostToolUse', bash('git push'), env);
  }
});

test('On another branch, pushes are checkpoints again', () => {
  const { repo, git } = sliceRepository('other-branch');
  const env = { HERALD_GUARD_ROOT: repo };
  openPullRequest('r2', env);
  git('checkout', '-q', '-b', 'another-slice');
  assert.doesNotMatch(hook('r2', 'PreToolUse', bash('git push -u origin another-slice'), env).stdout, /deny/);
});

test('A flag saved without its branch and commit is forgotten', () => {
  hook('r3', 'UserPromptSubmit', { prompt: 'Implement the slice' });
  const file = join(temp, 'herald-guard', 'r3.json');
  writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), pullRequest: true, pushes: 3 }));
  assert.doesNotMatch(hook('r3', 'PreToolUse', bash('git push'), {}).stdout, /deny/);
});
