// The loop guard's limits and metrics with synthetic hook inputs (ADR 0018, harness-engineering D-12).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { markdown, summarise, turnsOf } from './harness-metrics.mjs';

const temp = mkdtempSync(join(tmpdir(), 'herald-guard-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));
const guard = new URL('../.claude/hooks/guard.mjs', import.meta.url).pathname;

const hook = (session, event, extra = {}, env = {}) => {
  const result = spawnSync(process.execPath, [guard], {
    input: JSON.stringify({ session_id: session, hook_event_name: event, ...extra }),
    env: { ...process.env, TMPDIR: temp, HERALD_GUARD: '', ...env },
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
    hook('p2', 'PreToolUse', bash('git push'));
    hook('p2', 'PostToolUse', bash('git push'));
  }
  assert.match(hook('p2', 'PreToolUse', bash('git push')).stdout, /"permissionDecision":"deny"/);
});

test('A GitHub wake-up means the session has a pull request', () => {
  hook('p3', 'UserPromptSubmit', { prompt: '<wake reason="external-event"><event source="github">review</event></wake>' });
  for (let round = 0; round < 3; round++) {
    hook('p3', 'PreToolUse', bash('git push'));
    hook('p3', 'PostToolUse', bash('git push'));
  }
  assert.match(hook('p3', 'PreToolUse', bash('git push')).stdout, /"permissionDecision":"deny"/);
});
