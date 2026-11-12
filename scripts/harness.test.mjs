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
