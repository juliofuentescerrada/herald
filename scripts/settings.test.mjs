// The permissions declared in .claude/settings.json (harness-engineering D-10), matched the way Claude Code's
// documentation describes Bash rules: `*` stands for any text, and a space before a trailing `*` is part of the rule.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
const pattern = (rule) => new RegExp(`^${rule.slice(5, -1).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/ \*$/, '( .*)?').replace(/\*/g, '.*')}$`);
const denied = (command) => settings.permissions.deny.filter((rule) => rule.startsWith('Bash(')).some((rule) => pattern(rule).test(command));

// covers: agent-harness: An unattended session tries a force push
test('Force pushes are denied in any position, while a lease-protected push is not', () => {
  assert.ok(denied('git push --force origin main'));
  assert.ok(denied('git push origin main --force'));
  assert.ok(denied('git push -f'));
  assert.ok(denied('git reset --hard origin/main'));
  assert.ok(denied('tofu apply -auto-approve'));
  assert.ok(!denied('git push --force-with-lease origin claude/branch'));
  assert.ok(!denied('git push -u origin claude/branch'));
});

// covers: agent-harness: A session tries to read the user secrets
test('Listing or reading the user secrets is denied, while setting one the maintainer dictates is not', () => {
  assert.ok(denied('dotnet user-secrets list --project src/Herald.AppHost'));
  assert.ok(denied('dotnet user-secrets list'));
  assert.ok(denied('dotnet user-secrets --project src/Herald.AppHost list'));
  assert.ok(denied('cat ~/.microsoft/usersecrets/abc/secrets.json'));
  // The variants a literal folder name would miss: globs, find, jq.
  assert.ok(denied('cat ~/.microsoft/user*/*/secrets.json'));
  assert.ok(denied('find ~/.microsoft -name secrets.json -exec cat {} +'));
  assert.ok(denied('jq . ~/.microsoft/*/*/secrets.json'));
  assert.ok(denied('type %APPDATA%\\Microsoft\\UserSecrets\\abc\\secrets.json'));
  assert.ok(!denied('dotnet user-secrets set "Parameters:auth-authority" "<value>" --project src/Herald.AppHost'));
  // Routine commands that only name the folder or the property stay allowed.
  assert.ok(!denied('grep -n UserSecretsId src/Herald.AppHost/Herald.AppHost.csproj'));
  assert.ok(!denied('git log -S usersecrets'));
  const reads = settings.permissions.deny.filter((rule) => rule.startsWith('Read('));
  assert.ok(reads.includes('Read(~/.microsoft/usersecrets/**)'));
  assert.ok(reads.some((rule) => rule.includes('AppData/Roaming/Microsoft/UserSecrets')));
});
