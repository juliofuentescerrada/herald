#!/usr/bin/env node
// Sums the loop guard's per-turn metrics for a session (harness-engineering D-12), for a slice's pull request.
//
//   node scripts/harness-metrics.mjs                          the most recently active session
//   node scripts/harness-metrics.mjs <session> [<session>…]   those sessions, summed (a slice can span several)
//   node scripts/harness-metrics.mjs --list                   sessions with metrics, most recent first
//   node scripts/harness-metrics.mjs … --markdown             as a table for the pull request description
// The turn still in progress counts too, so the summary written while opening the pull request includes it.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const directory = () => join(tmpdir(), 'herald-guard');

// Sessions that have guard state, most recently active first.
export function sessions(dir = directory()) {
  if (!existsSync(dir)) return [];
  const states = readdirSync(dir).filter((name) => name.endsWith('.json'));
  states.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return states.map((name) => name.replace(/\.json$/, ''));
}

// A session's finished turns, plus the one in progress from its guard state.
export function turnsOf(session, dir = directory(), now = Date.now()) {
  const log = join(dir, `${session}.jsonl`);
  const turns = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];
  const state = join(dir, `${session}.json`);
  if (existsSync(state)) {
    const { turn } = JSON.parse(readFileSync(state, 'utf8'));
    const finished = turns.length > 0 && JSON.parse(turns.at(-1)).turn === turn?.number;
    if (turn && !finished) turns.push(JSON.stringify({ ...turn, durationMs: now - turn.startedAt }));
  }
  return turns;
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

export function markdown(names, totals) {
  return [
    `| Harness metrics (${names.map((name) => `\`${name}\``).join(', ')}) | |`,
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
  if (args.includes('--list')) {
    for (const session of sessions()) console.log(session);
    process.exit(0);
  }
  const named = args.filter((arg) => !arg.startsWith('--'));
  const chosen = named.length > 0 ? named : sessions().slice(0, 1);
  const turns = chosen.flatMap((session) => turnsOf(session));
  if (turns.length === 0) {
    console.error('No harness metrics for that session: the loop guard records them as tools run.');
    process.exit(1);
  }
  const totals = summarise(turns);
  console.log(args.includes('--markdown') ? markdown(chosen, totals) : JSON.stringify({ sessions: chosen, ...totals }));
}
