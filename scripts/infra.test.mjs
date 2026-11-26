// What the cloud-infrastructure specification requires of infra/'s code, read statically (m4-infra design D-6):
// node --test scripts/infra.test.mjs. The deployed result is checked by the plan and recorded in the change's design.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

const directory = join(root, 'infra');
const code = readdirSync(directory)
  .filter((file) => file.endsWith('.tf'))
  .map((file) => readFileSync(join(directory, file), 'utf8'))
  .join('\n');

// The block that `start` opens (its last `{`, or the next one) up to its matching `}`.
const block = (start) => {
  const at = code.indexOf(start);
  assert.ok(at >= 0, `${start} not found`);
  const open = code.indexOf('{', at + start.length - (start.endsWith('{') ? 1 : 0));
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    depth += code[i] === '{' ? 1 : code[i] === '}' ? -1 : 0;
    if (depth === 0) return code.slice(open, i + 1);
  }
  throw new Error(`no block after ${start}`);
};

const prefixes = [...block('slots = {').matchAll(/prefix\s*=\s*"([^"]+)"/g)].map((match) => match[1]);
const names = new Set(
  [...code.matchAll(/"([a-z]+)-\$\{(?:s|each\.value)\.prefix\}(-[a-z]+)?"/g)].flatMap(([, type, fn = '']) =>
    prefixes.map((prefix) => `${type}-${prefix}${fn}`),
  ),
);

// covers: cloud-infrastructure: Both slots are defined with their names
test('Both slots define their apps, job, Application Insights and identities under their names', () => {
  assert.deepEqual(prefixes, ['herald', 'herald-preview']);
  for (const name of [
    'ca-herald-api', 'ca-herald-public', 'ca-herald-admin', 'caj-herald-seed', 'appi-herald', 'id-herald-api', 'id-herald-web',
    'ca-herald-preview-api', 'ca-herald-preview-public', 'ca-herald-preview-admin', 'caj-herald-preview-seed',
    'appi-herald-preview', 'id-herald-preview-api', 'id-herald-preview-web',
  ]) {
    assert.ok(names.has(name), `${name} is not defined`);
  }
});

// covers: cloud-infrastructure: Minimum replicas and ingress
test('Every container app scales to zero, the API is internal and the web apps are external', () => {
  assert.deepEqual([...code.matchAll(/min_replicas\s*=\s*(\S+)/g)].map((match) => match[1]), ['0']);
  assert.match(block('resource "azurerm_container_app" "this"'), /external_enabled\s*=\s*each\.value\.external/);
  assert.match(block('"${slot}-api" = {'), /external\s*=\s*false/);
  assert.match(block('"${slot}-public" = {'), /external\s*=\s*true/);
  assert.match(block('"${slot}-admin" = {'), /external\s*=\s*true/);
});

// covers: cloud-infrastructure: No remote state of the platform
test("Steward's resources are found by name, never through its state", () => {
  assert.doesNotMatch(code, /terraform_remote_state/);
  for (const name of ['cae-shared', 'crjfcshared', 'log-shared', 'psql-jfc-shared']) {
    assert.match(code, new RegExp(`"${name}"`));
  }
});

// covers: cloud-infrastructure: No secrets defined
test('No secret, Key Vault or directory identifier is in the code', () => {
  assert.doesNotMatch(code, /^\s*secret\s*\{/m);
  assert.doesNotMatch(code, /azurerm_key_vault/);
  assert.doesNotMatch(code, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  assert.doesNotMatch(code, /ciamlogin\.com\/[^<]/);
});

// covers: cloud-infrastructure: Databases imported and protected
test('The slot databases are imported only once onboarded, and protected from destruction', () => {
  assert.match(code, /databases\s*=\s*var\.databases_onboarded\s*\?/);
  assert.match(block('import {'), /for_each\s*=\s*local\.databases/);
  const database = block('resource "azurerm_postgresql_flexible_server_database" "this"');
  assert.match(database, /for_each\s*=\s*local\.databases/);
  assert.match(database, /prevent_destroy\s*=\s*true/);
  assert.deepEqual([...block('slots = {').matchAll(/database\s*=\s*"([^"]+)"/g)].map((match) => match[1]), ['herald_main', 'herald_preview']);
});
