// Metrics that travel with the slice's commits (harness-resumption D-3): node --test scripts/harness-metrics.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { branchTotals, parseTrailer, recordTrailer, unrecorded } from './harness-metrics.mjs';

const temp = mkdtempSync(join(tmpdir(), 'herald-metrics-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));
const here = (path) => new URL(path, import.meta.url).pathname;

// A guard directory with one finished turn and one in progress for a session.
const guardDir = (name, session, finished, current) => {
  const dir = join(temp, name, 'herald-guard');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${session}.jsonl`), finished.map((turn) => JSON.stringify(turn)).join('\n') + '\n');
  writeFileSync(join(dir, `${session}.json`), JSON.stringify({ tools: 0, turn: current }));
  return dir;
};

test('A trailer records the counters since the previous one', () => {
  const now = 1_000_000;
  const dir = guardDir('t1', 's1', [{ turn: 1, maintainer: true, tools: 4, failures: 1, pushes: 1, durationMs: 60000 }], { number: 2, startedAt: now - 30000, tools: 2, failures: 0, pushes: 0, maintainer: false });

  const first = parseTrailer(recordTrailer(dir, now));
  assert.deepEqual(first.raw, { turns: 2, maintainer: 1, tools: 6, failures: 1, pushes: 1, ms: 90000 });
  assert.deepEqual(first.sessions, ['s1']);
  assert.equal(recordTrailer(dir, now), null, 'nothing new, no trailer');
  assert.equal(unrecorded('s1', dir, now + 10000).ms, 10000, 'the turn in progress keeps running');
});

// covers: agent-harness: A slice that spanned several containers
test('The branch summary adds trailers from earlier containers to the current session', () => {
  const { sessions, totals } = branchTotals(
    ['turns=3 maintainer=1 tools=40 failures=2 pushes=3 ms=600000 sessions=old'],
    { turns: 1, maintainer: 0, tools: 10, failures: 0, pushes: 1, ms: 120000 },
    'current',
  );
  assert.deepEqual(sessions, ['old', 'current']);
  assert.deepEqual(totals, { turns: 4, maintainerTurns: 1, tools: 50, failures: 2, pushes: 4, minutes: 12 });
});

test('An agent commit carries the trailer and a commit outside Claude Code does not', () => {
  const repo = join(temp, 'repo');
  mkdirSync(join(repo, 'scripts'), { recursive: true });
  copyFileSync(here('./harness-metrics.mjs'), join(repo, 'scripts', 'harness-metrics.mjs'));
  const tmp = join(temp, 'hook-temp');
  guardDir('hook-temp', 'agent', [{ turn: 1, maintainer: true, tools: 3, failures: 0, pushes: 0, durationMs: 1000 }], { number: 1, startedAt: Date.now(), tools: 0, failures: 0, pushes: 0, maintainer: true });

  const git = (env, ...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, TMPDIR: tmp, ...env } });
  git({}, 'init', '-q', '-b', 'main');
  git({}, 'config', 'user.email', 'test@example.org');
  git({}, 'config', 'user.name', 'Test');
  git({}, 'config', 'core.hooksPath', here('../.githooks'));
  git({}, 'config', 'commit.gpgsign', 'false');

  git({ CLAUDECODE: '' }, 'commit', '-q', '--allow-empty', '--no-verify', '-m', 'by hand');
  assert.doesNotMatch(git({}, 'log', '-1', '--format=%B'), /Harness-Metrics/);

  git({ CLAUDECODE: '1' }, 'commit', '-q', '--allow-empty', '--no-verify', '-m', 'task 2.1\n\nCo-Authored-By: Someone <a@example.org>');
  const trailers = git({}, 'log', '-1', '--format=%(trailers:key=Harness-Metrics,valueonly)').trim();
  assert.match(trailers, /tools=3 .*sessions=agent/);
  assert.match(git({}, 'log', '-1', '--format=%(trailers:key=Co-Authored-By,valueonly)'), /Someone/, 'the existing trailers stay trailers');
});
