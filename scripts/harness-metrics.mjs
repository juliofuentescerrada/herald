#!/usr/bin/env node
// Sums the loop guard's per-turn metrics for a session (harness-engineering D-12), for a slice's pull request.
//
//   node scripts/harness-metrics.mjs              the most recently active session
//   node scripts/harness-metrics.mjs <session>    that session
//   node scripts/harness-metrics.mjs --markdown   the same, as a table for the pull request description

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const directory = () => join(tmpdir(), 'herald-guard');

export function latestSession(dir = directory()) {
  if (!existsSync(dir)) return null;
  const logs = readdirSync(dir).filter((name) => name.endsWith('.jsonl'));
  logs.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return logs[0]?.replace(/\.jsonl$/, '') ?? null;
}

export function summarise(lines) {
  const turns = lines.map((line) => JSON.parse(line));
  const sum = (key) => turns.reduce((total, turn) => total + (turn[key] ?? 0), 0);
  return {
    turns: turns.length,
    maintainerTurns: turns.filter((turn) => turn.maintainer).length,
    tools: sum('tools'),
    failures: sum('failures'),
    pushes: sum('pushes'),
    minutes: Math.round(sum('durationMs') / 60000),
  };
}

export function markdown(session, totals) {
  return [
    `| Harness metrics (session \`${session}\`) | |`,
    '|---|---|',
    `| Turns (by the maintainer) | ${totals.turns} (${totals.maintainerTurns}) |`,
    `| Tool calls | ${totals.tools} |`,
    `| Failed commands | ${totals.failures} |`,
    `| Pushes | ${totals.pushes} |`,
    `| Agent time | ${totals.minutes} min |`,
  ].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const session = args.find((arg) => !arg.startsWith('--')) ?? latestSession();
  const log = session ? join(directory(), `${session}.jsonl`) : null;
  if (!log || !existsSync(log)) {
    console.error('No harness metrics yet: the loop guard writes them when a turn ends.');
    process.exit(1);
  }
  const totals = summarise(readFileSync(log, 'utf8').split('\n').filter(Boolean));
  console.log(args.includes('--markdown') ? markdown(session, totals) : JSON.stringify({ session, ...totals }));
}
