// The loop guard's limits and metrics with synthetic hook inputs (ADR 0018, harness-engineering D-12).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { markdown, summarise } from './harness-metrics.mjs';

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

// covers: agent-harness: A slice pull request
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

test('The summary adds the turns of a session up for the pull request', () => {
  const totals = summarise([
    JSON.stringify({ maintainer: true, tools: 10, failures: 1, pushes: 1, durationMs: 120000 }),
    JSON.stringify({ maintainer: false, tools: 5, failures: 0, pushes: 1, durationMs: 60000 }),
  ]);
  assert.deepEqual(totals, { turns: 2, maintainerTurns: 1, tools: 15, failures: 1, pushes: 2, minutes: 3 });
  assert.match(markdown('s', totals), /\| Tool calls \| 15 \|/);
});
