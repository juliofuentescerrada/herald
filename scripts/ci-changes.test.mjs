// The classification of changed files for CI (ci-path-filters D-1): node --test scripts/ci-changes.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { classify, touchesCode } from './ci-changes.mjs';

const temp = mkdtempSync(join(tmpdir(), 'herald-ci-changes-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));

// covers: continuous-integration: Only documentation and harness files change
test('Documentation and harness files alone are not code', () => {
  assert.equal(
    touchesCode([
      'docs/roadmap.md',
      'docs/adr/0018-deliver-in-batches-tested-on-a-deployed-preview.md',
      'openspec/changes/some-change/tasks.md',
      'openspec/specs/agent-harness/spec.md',
      'prototypes/frontend/check-in-states.html',
      'README.md',
      'CLAUDE.md',
      'src/CLAUDE.md',
      'web/CLAUDE.md',
      '.claude/skills/herald-docs/SKILL.md',
      '.claude/agents/herald-reviewer.md',
      '.github/pull_request_template.md',
      '.github/ISSUE_TEMPLATE/batch.yml',
      'scripts/rules.mjs',
      '.claude/hooks/guard.mjs',
      '.claude/settings.json',
      '.githooks/pre-commit',
      'cspell.config.yaml',
    ]),
    false,
  );
});

// covers: continuous-integration: A source file changes
test('Any file outside both groups is code', () => {
  for (const file of ['src/Herald.Host/Program.cs', 'web/projects/admin/src/main.ts', 'tests/Herald.Host.Tests/CheckInTests.cs', 'tools/Herald.Seed/Scenarios.cs', 'e2e/journeys/a.spec.ts', '.github/workflows/ci.yml', 'Directory.Packages.props', 'web/package.json', 'docs.md']) {
    assert.equal(touchesCode(['docs/roadmap.md', file]), true, file);
  }
});

// covers: continuous-integration: ADR 0017 changes
test('ADR 0017 is code, because an architecture test reads its inventory', () => {
  assert.equal(touchesCode(['docs/adr/0017-notifications-consume-fact-events.md']), true);
});

// covers: continuous-integration: The base is unknown
test('Without a usable base the change is code', () => {
  assert.equal(classify('0000000000000000000000000000000000000000', 'HEAD'), true);
  assert.equal(classify('', 'HEAD'), true);
  assert.equal(classify('not-a-commit', 'HEAD'), true);
});

test('A real diff between two commits is classified', () => {
  const repo = join(temp, 'repo');
  mkdirSync(repo);
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, CLAUDECODE: '' } }).trim();
  const commit = (file, message) => {
    mkdirSync(join(repo, dirname(file)), { recursive: true });
    writeFileSync(join(repo, file), message);
    git('add', '-A');
    git('commit', '-q', '--no-verify', '-m', message);
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.org');
  git('config', 'user.name', 'Test');
  git('config', 'commit.gpgsign', 'false');
  const start = commit('README.md', 'start');
  const docs = commit('docs/roadmap.md', 'docs');
  const code = commit('src/Program.cs', 'code');
  assert.equal(classify(start, docs, repo), false);
  assert.equal(classify(docs, code, repo), true);
});
