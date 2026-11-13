#!/usr/bin/env node
// Classifies a change for CI (ci-path-filters D-1): `code=true` unless every changed file is documentation or harness.
// Both workflows use it, so the classification lives here only.
//
//   node scripts/ci-changes.mjs <base> <head>   prints code=true|false, the format of $GITHUB_OUTPUT
//
// Anything not listed below is code. Without a usable base (a new branch, an all-zero `before`, a commit that cannot
// be read) the change is code: that costs minutes but never skips a check.

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Read by no build and no test outside the `rules` job.
const documentation = [
  /^docs\//,
  /^openspec\//,
  /^prototypes\//,
  /^README\.md$/,
  /^LICENSE$/,
  /(^|\/)CLAUDE\.md$/,
  /^\.claude\/(skills|agents|commands)\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^\.github\/pull_request_template\.md$/,
];

// Tested by the `rules` job itself (node --test scripts/*.test.mjs).
const harness = [/^scripts\//, /^\.claude\/hooks\//, /^\.claude\/settings\.json$/, /^\.githooks\//, /^\.mcp\.json$/, /^cspell\.config\.yaml$/];

// Documents that a build or test reads: NotifiableFactsTests reads ADR 0017's inventory.
const readByTests = [/^docs\/adr\/0017-[^/]+\.md$/];

export function isCode(file) {
  if (readByTests.some((pattern) => pattern.test(file))) return true;
  return ![...documentation, ...harness].some((pattern) => pattern.test(file));
}

export const touchesCode = (files) => files.some(isCode);

export function changedFiles(base, head, cwd = process.cwd()) {
  if (!base || /^0+$/.test(base) || !head) return null;
  try {
    const output = execFileSync('git', ['diff', '--name-only', base, head], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

export function classify(base, head, cwd = process.cwd()) {
  const files = changedFiles(base, head, cwd);
  return files === null ? true : touchesCode(files);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [base, head] = process.argv.slice(2);
  const code = classify(base, head);
  console.log(`code=${code}`);
  console.error(code ? 'The change touches code: every CI job runs.' : 'Documentation and harness only: the code jobs are skipped.');
}
