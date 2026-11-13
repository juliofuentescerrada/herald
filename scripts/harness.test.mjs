// The agent-harness spec's procedure checks (harness-engineering): node --test scripts/*.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

const read = (path) => readFileSync(join(root, path), 'utf8');

// covers: agent-harness: The slice procedure requires a read-only review
test('The reviewer can only read, and the slice procedure requires its review in the pull request', () => {
  const tools = read('.claude/agents/herald-reviewer.md').match(/^tools:\s*(.+)$/m)?.[1].split(',').map((tool) => tool.trim());
  assert.ok(tools?.length, 'the reviewer declares its tools');
  for (const tool of tools) assert.ok(['Read', 'Grep', 'Glob', 'mcp__codegraph__codegraph_explore'].includes(tool), `${tool} is not a reading tool`);

  const procedure = read('CLAUDE.md');
  assert.match(procedure, /Before opening a slice's pull request[^\n]*`herald-reviewer`/);
  assert.match(procedure, /records its findings and how each was resolved/);
});

// covers: delivery-tracking: The templates ask for dependencies
test('The slice template asks for its dependencies and the batch template for its slices\' order and dependencies', () => {
  // The field's own block, up to the next field, so another field's `required` cannot satisfy it.
  const field = (template, id) => read(template).split(/\n {2}- type: /).find((block) => new RegExp(`\\n {4}id: ${id}\\n`).test(`\n${block}`)) ?? '';
  const depends = field('.github/ISSUE_TEMPLATE/slice.yml', 'depends');
  assert.match(depends, /label: Depends on/);
  assert.match(depends, /validations:\n {6}required: true/);
  assert.match(field('.github/ISSUE_TEMPLATE/batch.yml', 'slices'), /in order, each with the slices it depends on/);
});

// covers: delivery-tracking: Two independent slices
test('The procedure starts a slice only once its dependencies are merged, and at most two at once', () => {
  const decision = read('docs/adr/0018-deliver-in-batches-tested-on-a-deployed-preview.md');
  // In progress lasts until the merge, whatever status label the slice carries meanwhile.
  assert.match(decision, /A slice is \*\*in progress\*\* from its start until its pull request is merged: while its sub-issue is labelled `in-progress`, `ready-to-test` or `feedback`\. At most two are in progress at once\./);
  assert.match(decision, /starts every open slice sub-issue whose declared dependencies are merged, up to that limit, each in a session of its own/);
  assert.match(read('CLAUDE.md'), /start a slice only within ADR 0018's limit on slices in progress and once the slices in its issue's "Depends on" are merged/);
});

// covers: delivery-tracking: Opening a slice pull request
test('The pull request template asks for the test script, the review, the archive and the harness metrics', () => {
  const template = read('.github/pull_request_template.md');
  for (const section of ['## Test script', '## Review', '## Archive', '## Harness metrics']) assert.ok(template.includes(`\n${section}\n`), section);
  assert.match(template, /## Harness metrics\n\n<!-- The output of `node scripts\/harness-metrics\.mjs --branch --markdown`/);
});

// covers: agent-harness: Herald's rules take precedence
test('CLAUDE.md puts the specifications, tests, folder rules and ADRs above the plugin', () => {
  assert.match(read('CLAUDE.md'), /ponytail plugin[^\n]*never removes what the change's specifications, tests, folder rules or ADRs require: those win\./);
});
