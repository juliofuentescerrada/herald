#!/usr/bin/env node
// Guards against unattended loops that would spend the session's usage (ADR 0018).
// One script for every hook event; state per session in the system temp directory.
//
// - Tool budget: tool calls since the maintainer's last message. A warning at 80 %, then
//   everything is refused except git and GitHub tools, so the agent can record where it stopped.
// - Repeated failure: the same Bash command failing several times in a row is refused.
// - Push rounds: several pushes since the maintainer's last message are refused, counted only once the session has
//   opened or updated a pull request; earlier pushes are the slice's checkpoints (harness-resumption D-2). The pull
//   request is tied to the branch and commit where it was seen, and forgotten once that commit is in origin/main or
//   the session is on another branch (ci-path-filters D-5).
// - Phase: the file tools cannot edit production code (src/, web/projects/, tools/) while no active change in
//   openspec/changes/ is approved for implementation (harness-resumption D-6).
//
// Messages that wake the session from GitHub or a schedule are not the maintainer and reset nothing.
// - Metrics: each turn's tool calls, failures, pushes and duration, appended at Stop to
//   <tmp>/herald-guard/<session>.jsonl (harness-engineering D-12); scripts/harness-metrics.mjs sums them.
//
// Limits: HERALD_GUARD_MAX_TOOLS (400), HERALD_GUARD_MAX_FAILURES (3), HERALD_GUARD_MAX_PUSHES (3).
// HERALD_GUARD=off disables every guard. HERALD_GUARD_ROOT names another repository root (the guard's tests).

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const limit = (name, fallback) => {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const maxTools = limit('HERALD_GUARD_MAX_TOOLS', 400);
const maxFailures = limit('HERALD_GUARD_MAX_FAILURES', 3);
const maxPushes = limit('HERALD_GUARD_MAX_PUSHES', 3);
const warnAt = Math.floor(maxTools * 0.8);

const stopAdvice =
  'Stop working on the task. Commit and push what is done, write on the pull request or its issue ' +
  'where you stopped, why, and what you need from the maintainer, then end your turn. ' +
  'Do not try to work around this guard.';

const readInput = () => {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
};

const stateFile = (sessionId) => {
  const dir = join(tmpdir(), 'herald-guard');
  mkdirSync(dir, { recursive: true });
  return join(dir, `${String(sessionId).replace(/[^\w-]/g, '_')}.json`);
};

const loadState = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return { tools: 0, totalTools: 0, failures: {}, pushes: 0, warned: false, turn: newTurn() };
  }
};

// The current turn's counters, reset when any message starts a turn, the maintainer's or a wake-up's.
function newTurn() {
  return { number: 0, startedAt: Date.now(), tools: 0, failures: 0, pushes: 0, maintainer: true };
}

const normalise = (command) => String(command ?? '').trim().replace(/\s+/g, ' ');
const isPush = (command) => /(^|[;&|]\s*)git\s+push\b/.test(command);
const isGit = (command) => /^git\s/.test(command);
const fromMaintainer = (prompt) =>
  !/<wake\b|reason="external-event"|<event source=|<task-notification>|<webhook-payload>/.test(String(prompt ?? ''));

const editTools = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const repositoryRoot = process.env.HERALD_GUARD_ROOT || fileURLToPath(new URL('../../', import.meta.url));
const productionPaths = ['src/', 'web/projects/', 'tools/'];

const isProduction = (path) => {
  const inRepository = relative(repositoryRoot, resolve(repositoryRoot, String(path))).split('\\').join('/');
  return productionPaths.some((prefix) => inRepository.startsWith(prefix));
};

// An active change (any folder of openspec/changes/ but the archive) whose proposal records its approval.
const approvedChange = () => {
  const changes = join(repositoryRoot, 'openspec', 'changes');
  try {
    return readdirSync(changes, { withFileTypes: true }).some((entry) => {
      if (!entry.isDirectory() || entry.name === 'archive') return false;
      const proposal = join(changes, entry.name, 'proposal.md');
      return existsSync(proposal) && /\*\*Approved for implementation on /.test(readFileSync(proposal, 'utf8'));
    });
  } catch {
    return false;
  }
};

// The session has a pull request once it opens or updates one, or subscribes to one (harness-resumption D-2).
const pullRequestTools = new Set([
  'mcp__github__create_pull_request',
  'mcp__github__update_pull_request',
  'mcp__claude-code-remote__subscribe_pr_activity',
]);
const opensPullRequest = (command) => /(^|[;&|]\s*)gh\s+pr\s+(create|edit)\b/.test(command);
const githubEvent = (prompt) => /<event source="github"/.test(String(prompt ?? ''));

// The rules script is loaded only after an edit; a failure to run it never blocks the edit.
const editedFileFindings = async (path) => {
  try {
    const { run } = await import(new URL('../../scripts/rules.mjs', import.meta.url));
    return run([path]);
  } catch (error) {
    return [`(the rules could not run: ${String(error?.message ?? error).split('\n')[0]})`];
  }
};

const deny = (reason) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }),
  );
};

const input = readInput();
if (!input || process.env.HERALD_GUARD === 'off') process.exit(0);

const file = stateFile(input.session_id ?? 'unknown');
const state = loadState(file);
state.turn ??= newTurn();

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();
  } catch {
    return null;
  }
};

// Where the session's pull request was seen (ci-path-filters D-5). A pull request tool records the current branch and
// commit. A GitHub event records them only when nothing was recorded yet (a fresh container): a late event about a merged
// pull request must not tie the next change's commits to it. A new branch starts the rounds again.
const markPullRequest = ({ fromEvent = false } = {}) => {
  const recorded = state.pullRequest && state.pullRequest !== true ? state.pullRequest : null;
  if (fromEvent && (recorded || state.pullRequest === false)) return;
  const branch = git('branch', '--show-current');
  if (!recorded || recorded.branch !== branch) state.pushes = 0;
  state.pullRequest = { branch, commit: git('rev-parse', 'HEAD') };
};

// Whether pushes count towards the rounds: a pull request was seen on this branch and has not been merged. Merged means
// the recorded commit is in origin/main, which `fetch` refreshes first (only when a push would be refused). Herald
// merges with merge commits, so the recorded commit reaches main; each counted push moves it to the pushed commit,
// which follows a rebase. A detached HEAD counts as the same branch.
const pullRequestOpen = ({ fetch = false } = {}) => {
  // A flag without a location (saved before ci-path-filters) cannot be tied to a pull request: forgotten.
  if (!state.pullRequest || state.pullRequest === true) return false;
  const seen = state.pullRequest;
  const branch = git('branch', '--show-current');
  if (seen.branch && branch && branch !== seen.branch) return false;
  if (fetch) git('fetch', '--quiet', '--no-tags', 'origin', 'main');
  if (seen.commit && git('merge-base', '--is-ancestor', seen.commit, 'origin/main') !== null) {
    state.pullRequest = false;
    state.pushes = 0;
    return false;
  }
  return true;
};

const command = input.tool_name === 'Bash' ? normalise(input.tool_input?.command) : '';
let exitCode = 0;

switch (input.hook_event_name) {
  case 'UserPromptSubmit':
    state.turn = { ...newTurn(), number: state.turn.number + 1, maintainer: fromMaintainer(input.prompt) };
    // A GitHub event after the session's first turn comes from a pull request it subscribed to; the first turn's event
    // is the trigger that started the session (a merge, a label), which says nothing about this session's pull request.
    if (githubEvent(input.prompt) && state.turn.number > 1) markPullRequest({ fromEvent: true });
    if (fromMaintainer(input.prompt)) {
      state.tools = 0;
      state.pushes = 0;
      state.failures = {};
      state.warned = false;
    }
    break;

  case 'PreToolUse': {
    state.tools += 1;
    state.turn.tools += 1;
    state.totalTools += 1;
    const escape = isGit(command) || String(input.tool_name).startsWith('mcp__github__');
    const editedPath = editTools.has(input.tool_name) ? (input.tool_input?.file_path ?? input.tool_input?.notebook_path) : null;
    if (state.tools > maxTools && !escape) {
      deny(`Herald guard: ${maxTools} tool calls since the maintainer's last message. ${stopAdvice}`);
    } else if (editedPath && isProduction(editedPath) && !approvedChange()) {
      deny(
        'Herald guard: no approved change. Production code (src/, web/projects/, tools/) needs an active OpenSpec change ' +
          "approved for implementation: propose one (/opsx:propose) and wait for the maintainer's approval.",
      );
    } else if (command && (state.failures[command] ?? 0) >= maxFailures) {
      deny(
        `Herald guard: this command has failed ${maxFailures} times in a row. Retrying it will not help. ` +
          `Find the cause another way or ${stopAdvice.charAt(0).toLowerCase()}${stopAdvice.slice(1)}`,
      );
    } else if (isPush(command) && state.pushes >= maxPushes && pullRequestOpen({ fetch: true })) {
      deny(
        `Herald guard: ${maxPushes} pushes since the maintainer's last message. ` +
          'Further fixes need the maintainer: describe the remaining failure on the pull request and end your turn.',
      );
    }
    break;
  }

  case 'PostToolUse':
    if (command) {
      delete state.failures[command];
      if (isPush(command)) {
        if (pullRequestOpen()) {
          state.pushes += 1;
          state.pullRequest.commit = git('rev-parse', 'HEAD') ?? state.pullRequest.commit;
        }
        state.turn.pushes += 1;
      }
    }
    if (pullRequestTools.has(input.tool_name) || opensPullRequest(command)) markPullRequest();
    // Repository rules on the file just edited (harness-engineering D-1): the agent sees a finding in the same turn.
    if (editTools.has(input.tool_name) && input.tool_input?.file_path) {
      const findings = await editedFileFindings(input.tool_input.file_path);
      if (findings.length > 0) {
        process.stderr.write(`Herald rules on the file you edited:\n${findings.join('\n')}\n`);
        exitCode = 2;
      }
    }
    if (state.tools >= warnAt && !state.warned) {
      state.warned = true;
      process.stderr.write(
        `Herald guard: ${state.tools} of ${maxTools} tool calls used since the maintainer's last message. ` +
          'Finish the current step, then commit, push and report; if the slice needs more, propose splitting it.',
      );
      exitCode = 2;
    }
    break;

  case 'PostToolUseFailure':
    if (command && !input.is_interrupt && /^Exit code \d+/.test(String(input.error ?? ''))) {
      state.failures[command] = (state.failures[command] ?? 0) + 1;
      state.turn.failures += 1;
    }
    break;

  // One line per turn; a Stop hook must never block the turn from ending, so nothing here exits non-zero.
  case 'Stop':
    appendFileSync(
      file.replace(/\.json$/, '.jsonl'),
      `${JSON.stringify({
        session: input.session_id ?? 'unknown',
        turn: state.turn.number,
        maintainer: state.turn.maintainer,
        tools: state.turn.tools,
        failures: state.turn.failures,
        pushes: state.turn.pushes,
        durationMs: Date.now() - state.turn.startedAt,
        endedAt: new Date().toISOString(),
      })}\n`,
    );
    break;
}

writeFileSync(file, JSON.stringify(state));
process.exit(exitCode);
