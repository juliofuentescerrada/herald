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
  const slice = read('.github/ISSUE_TEMPLATE/slice.yml');
  assert.match(slice, /id: depends\n {4}attributes:\n {6}label: Depends on/);
  assert.match(slice, /id: depends[\s\S]*?required: true/);
  assert.match(read('.github/ISSUE_TEMPLATE/batch.yml'), /in order, each with the slices it depends on/);
});

// covers: delivery-tracking: Two independent slices
test('The procedure starts a slice only once its dependencies are merged, and at most two at once', () => {
  const procedure = read('CLAUDE.md');
  assert.match(procedure, /at most two slices are in progress, each started only once the slices it depends on/);
  assert.match(read('docs/adr/0018-deliver-in-batches-tested-on-a-deployed-preview.md'), /whose declared dependencies are merged, and refuses to start while two slices are `in-progress`/);
});

// covers: delivery-tracking: Opening a slice pull request
test('The pull request template asks for the test script, the review, the archive and the harness metrics', () => {
  const template = read('.github/pull_request_template.md');
  for (const section of ['## Test script', '## Review', '## Archive']) assert.ok(template.includes(section), section);
  assert.match(template, /harness-metrics\.mjs --branch --markdown/);
});
