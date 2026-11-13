// Secrets scanned before commit and in CI (private-data-guard D-2), through the pinned gitleaks of scripts/gitleaks:
// node --test scripts/gitleaks.test.mjs (CI installs gitleaks first; scripts/bootstrap does locally).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { root } from './rules.mjs';

const temp = mkdtempSync(join(tmpdir(), 'herald-gitleaks-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));

// Stages one file in a new repository and scans the staged change as the pre-commit hook does.
const scanStaged = (name, content) => {
  const repo = join(temp, name);
  execFileSync('git', ['init', '-q', repo]);
  writeFileSync(join(repo, 'config.ini'), content);
  execFileSync('git', ['add', 'config.ini'], { cwd: repo });
  return spawnSync(join(root, 'scripts', 'gitleaks'), ['git', '--pre-commit', '--staged', repo], { encoding: 'utf8' });
};

// covers: repository-rules: A secret is committed
test('A staged cloud access key fails the scan', () => {
  // Built at run time, so this file holds no secret for the scan of its own commit.
  const keyId = ['AKIA', 'QQQQ', '7Z4N2X3P5T7B'].join('');
  const secret = ['k9Vq2', 'Lw8Tz', 'R4mYc', 'N7pXs', 'B3hJd', 'F6gKa', 'E1uWo', 'I5yZt'].join('');
  const result = scanStaged('secret', `aws_access_key_id = ${keyId}\naws_secret_access_key = ${secret}\n`);
  assert.equal(result.status, 1, result.stderr);
  const output = result.stdout + result.stderr;
  assert.match(output, /leaks found: [1-9]/);
  assert.match(output, /File:\s+config\.ini/, 'the finding names the file');
  assert.match(output, /RuleID:\s+aws-access-token/, 'and the rule that matched');
});

// covers: repository-rules: Development placeholders
test('The development connection strings and the E2E password pass', () => {
  // The real files, read at run time, so the test follows them when they change.
  const placeholders = [join('src', 'Herald.Host', 'app' + 'settings.Development.json'), join('e2e', 'environment.ts')].map((path) => readFileSync(join(root, path), 'utf8')).join('\n');
  assert.match(placeholders, /SAS_KEY_VALUE/);
  const result = scanStaged('placeholders', placeholders);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
