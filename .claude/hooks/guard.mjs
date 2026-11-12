#!/usr/bin/env node
// Guards against unattended loops that would spend the session's usage (ADR 0018).
// One script for every hook event; state per session in the system temp directory.
//
// - Tool budget: tool calls since the maintainer's last message. A warning at 80 %, then
//   everything is refused except git and GitHub tools, so the agent can record where it stopped.
// - Repeated failure: the same Bash command failing several times in a row is refused.
// - Push rounds: several pushes since the maintainer's last message are refused.
//
// Messages that wake the session from GitHub or a schedule are not the maintainer and reset nothing.
// Limits: HERALD_GUARD_MAX_TOOLS (400), HERALD_GUARD_MAX_FAILURES (3), HERALD_GUARD_MAX_PUSHES (3).
// HERALD_GUARD=off disables every guard.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
    return { tools: 0, totalTools: 0, failures: {}, pushes: 0, warned: false };
  }
};

const normalise = (command) => String(command ?? '').trim().replace(/\s+/g, ' ');
const isPush = (command) => /(^|[;&|]\s*)git\s+push\b/.test(command);
const isGit = (command) => /^git\s/.test(command);
const fromMaintainer = (prompt) =>
  !/<wake\b|reason="external-event"|<event source=|<task-notification>|<webhook-payload>/.test(String(prompt ?? ''));

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
const command = input.tool_name === 'Bash' ? normalise(input.tool_input?.command) : '';
let exitCode = 0;

switch (input.hook_event_name) {
  case 'UserPromptSubmit':
    if (fromMaintainer(input.prompt)) {
      state.tools = 0;
      state.pushes = 0;
      state.failures = {};
      state.warned = false;
    }
    break;

  case 'PreToolUse': {
    state.tools += 1;
    state.totalTools += 1;
    const escape = isGit(command) || String(input.tool_name).startsWith('mcp__github__');
    if (state.tools > maxTools && !escape) {
      deny(`Herald guard: ${maxTools} tool calls since the maintainer's last message. ${stopAdvice}`);
    } else if (command && (state.failures[command] ?? 0) >= maxFailures) {
      deny(
        `Herald guard: this command has failed ${maxFailures} times in a row. Retrying it will not help. ` +
          `Find the cause another way or ${stopAdvice.charAt(0).toLowerCase()}${stopAdvice.slice(1)}`,
      );
    } else if (isPush(command) && state.pushes >= maxPushes) {
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
      if (isPush(command)) state.pushes += 1;
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
    }
    break;
}

writeFileSync(file, JSON.stringify(state));
process.exit(exitCode);
