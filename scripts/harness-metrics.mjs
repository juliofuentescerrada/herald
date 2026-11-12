#!/usr/bin/env node
// Sums the loop guard's per-turn metrics for a session (harness-engineering D-12), for a slice's pull request.
//
//   node scripts/harness-metrics.mjs                          the most recently active session
//   node scripts/harness-metrics.mjs <session> [<session>…]   those sessions, summed (a slice can span several)
//   node scripts/harness-metrics.mjs --list                   sessions with metrics, most recent first
//   node scripts/harness-metrics.mjs --branch [--markdown]    the slice's branch: its commits' trailers and the
//                                                             turns not yet committed (harness-resumption D-3)
//   node scripts/harness-metrics.mjs --trailer                the latest session's counters since its last trailer,
//                                                             marked as recorded (used by .githooks/prepare-commit-msg)
//   node scripts/harness-metrics.mjs … --markdown             as a table for the pull request description
// The turn still in progress counts too, so the summary written while opening the pull request includes it.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

const counters = ['turns', 'maintainer', 'tools', 'failures', 'pushes', 'ms'];

// Raw counters of a list of turns, the unit of a trailer.
export function count(lines) {
  const turns = lines.map((line) => JSON.parse(line));
  const sum = (key) => turns.reduce((total, turn) => total + (turn[key] ?? 0), 0);
  return {
    turns: turns.length,
    maintainer: turns.filter((turn) => turn.maintainer).length,
    tools: sum('tools'),
    failures: sum('failures'),
    pushes: sum('pushes'),
    ms: sum('durationMs'),
  };
}

const toTotals = (raw) => ({
  turns: raw.turns,
  maintainerTurns: raw.maintainer,
  tools: raw.tools,
  failures: raw.failures,
  pushes: raw.pushes,
  minutes: Math.round(raw.ms / 60000),
});

export const summarise = (lines) => toTotals(count(lines));

// The session's counters not yet written to a trailer.
export function unrecorded(session, dir = directory(), now = Date.now()) {
  const all = count(turnsOf(session, dir, now));
  const state = join(dir, `${session}.json`);
  const recorded = existsSync(state) ? (JSON.parse(readFileSync(state, 'utf8')).recorded ?? {}) : {};
  return Object.fromEntries(counters.map((key) => [key, Math.max(0, all[key] - (recorded[key] ?? 0))]));
}

// The trailer value for the latest session, and the mark that its counters are recorded; null when nothing is new.
export function recordTrailer(dir = directory(), now = Date.now()) {
  const [session] = sessions(dir);
  if (!session) return null;
  const delta = unrecorded(session, dir, now);
  if (delta.tools === 0 && delta.turns === 0) return null;
  const file = join(dir, `${session}.json`);
  const state = JSON.parse(readFileSync(file, 'utf8'));
  const all = count(turnsOf(session, dir, now));
  writeFileSync(file, JSON.stringify({ ...state, recorded: all }));
  return `${counters.map((key) => `${key}=${delta[key]}`).join(' ')} sessions=${session}`;
}

export function parseTrailer(value) {
  const fields = Object.fromEntries(
    String(value).trim().split(/\s+/).map((pair) => pair.split('=')).filter((pair) => pair.length === 2),
  );
  return {
    raw: Object.fromEntries(counters.map((key) => [key, Number.parseInt(fields[key] ?? '0', 10) || 0])),
    sessions: (fields.sessions ?? '').split(',').filter(Boolean),
  };
}

// Sums trailer values and an optional uncommitted delta into pull request totals.
export function branchTotals(trailers, pending = null, pendingSession = null) {
  const sum = Object.fromEntries(counters.map((key) => [key, 0]));
  const names = new Set();
  for (const value of trailers) {
    const { raw, sessions: ids } = parseTrailer(value);
    for (const key of counters) sum[key] += raw[key];
    ids.forEach((id) => names.add(id));
  }
  if (pending && (pending.tools > 0 || pending.turns > 0)) {
    for (const key of counters) sum[key] += pending[key];
    if (pendingSession) names.add(pendingSession);
  }
  return { sessions: [...names], totals: toTotals(sum) };
}

// The Harness-Metrics trailers of the branch's commits since it left main.
export function branchTrailers(cwd = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const base = ['origin/main', 'main'].find((ref) => {
    try {
      git('rev-parse', '--verify', '--quiet', ref);
      return true;
    } catch {
      return false;
    }
  });
  if (!base) return [];
  const log = git('log', `${base}..HEAD`, '--format=%(trailers:key=Harness-Metrics,valueonly,separator=%x0A)');
  return log.split('\n').map((line) => line.trim()).filter(Boolean);
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
  if (args.includes('--trailer')) {
    const trailer = recordTrailer();
    if (trailer) console.log(trailer);
    process.exit(0);
  }
  if (args.includes('--branch')) {
    const [session] = sessions();
    const { sessions: names, totals } = branchTotals(branchTrailers(), session ? unrecorded(session) : null, session);
    console.log(args.includes('--markdown') ? markdown(names, totals) : JSON.stringify({ sessions: names, ...totals }));
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
