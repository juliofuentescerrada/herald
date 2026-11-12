#!/usr/bin/env node
// The slice's state for the agent (harness-resumption D-4): the branch, each active change with its approval and next
// tasks, the last checkpoint and the procedure steps still ahead. Read-only. Claude Code's SessionStart hook runs it
// after a compaction and on resume; the agent can run it at any time: node scripts/slice-state.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const git = (cwd, ...args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

// Active changes: every folder of openspec/changes but the archive, with their approval and tasks.
export function activeChanges(root) {
  const dir = join(root, 'openspec', 'changes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map(({ name }) => {
      const read = (file) => (existsSync(join(dir, name, file)) ? readFileSync(join(dir, name, file), 'utf8') : '');
      const tasks = [...read('tasks.md').matchAll(/^- \[( |x)\] (.+)$/gm)].map(([, mark, text]) => ({ done: mark === 'x', text }));
      return {
        name,
        approved: /Approved for implementation/.test(read('proposal.md')),
        done: tasks.filter((task) => task.done).length,
        total: tasks.length,
        next: tasks.filter((task) => !task.done).map((task) => task.text),
      };
    });
}

const baseRef = (cwd) => ['origin/main', 'main'].find((ref) => git(cwd, 'rev-parse', '--verify', '--quiet', ref) !== '');

export function sliceState(cwd = process.cwd()) {
  const root = git(cwd, 'rev-parse', '--show-toplevel') || cwd;
  const branch = git(root, 'branch', '--show-current') || '(detached)';
  const base = baseRef(root);
  const checkpoint = base ? git(root, 'log', '-1', '--format=%h %s', `${base}..HEAD`) : git(root, 'log', '-1', '--format=%h %s');
  const changes = activeChanges(root);

  const lines = ['Herald slice state (scripts/slice-state.mjs)', `- Branch: ${branch}`];
  if (changes.length === 0) {
    lines.push('- No active change in openspec/changes/: production code needs an approved one (/opsx:propose).');
  }
  for (const change of changes) {
    lines.push(`- Change ${change.name}: ${change.approved ? 'approved for implementation' : 'NOT approved yet'}, ${change.done}/${change.total} tasks done`);
    for (const task of change.next.slice(0, 3)) lines.push(`  - next: ${task}`);
    if (change.next.length > 3) lines.push(`  - … ${change.next.length - 3} more`);
  }
  lines.push(`- Last checkpoint: ${checkpoint || `none on this branch${base ? ` since ${base}` : ''}`}`);
  lines.push(
    '- Procedure ahead (CLAUDE.md): continue from the first unchecked task; commit and push each task with its box checked;',
    '  before the pull request, the herald-reviewer review, the e2e test script and',
    '  `node scripts/harness-metrics.mjs --branch --markdown`; the specification sync and archive go in the slice.',
  );
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(sliceState());
}
