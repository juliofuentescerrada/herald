// The repository-rules spec for scripts/rules.mjs: node --test scripts/
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { checkSpelling, checkTerms, licenceFindings, root } from './rules.mjs';

const folder = 'scripts/.rules-test';
mkdirSync(join(root, folder, 'src/Herald.Tournaments/Domain'), { recursive: true });
after(() => rmSync(join(root, folder), { recursive: true, force: true }));

const file = (path, content) => {
  writeFileSync(join(root, folder, path), content);
  return `${folder}/${path}`;
};

const config = {
  scopes: { code: [`${folder}/src/`] },
  terms: [
    { name: 'tenant', pattern: '\\btenants?\\b', flags: 'i', scopes: ['code'], message: 'Use organisation.' },
    { name: 'game names', pattern: '\\b(Magic|Pauper)\\b', scopes: ['code'], message: 'No game names in code.' },
    { name: 'sibling projects', pattern: '\\b(Arcana|Archivist|PauperPilot)\\b', scopes: ['code'], message: 'No sibling projects.' },
  ],
  exceptions: [{ path: `${folder}/src/Shared.cs`, term: 'sibling projects', reason: 'Shared directory.' }],
};

// covers: repository-rules: The agent writes a forbidden term
test('A forbidden term in code is reported with its file, line and rule', () => {
  const path = file('src/Owner.cs', '// first line\n// each tenant owns it\n');
  assert.deepEqual(checkTerms([path], config), [`${path}:2  tenant: Use organisation.`]);
});

// covers: repository-rules: A game name in a domain type
test('A game name in a domain type is reported', () => {
  const path = file('src/Herald.Tournaments/Domain/Format.cs', 'public enum Format { Pauper }\n');
  assert.equal(checkTerms([path], config).length, 1);
});

// covers: repository-rules: A sibling project in code
test('A sibling project named in code is reported', () => {
  const path = file('src/Client.cs', '// talks to PauperPilot\n');
  assert.match(checkTerms([path], config)[0], /sibling projects/);
});

// covers: repository-rules: An external name that must stay
test('An exception with its reason lets an external name stay', () => {
  const path = file('src/Shared.cs', '// the directory shared with Arcana\n');
  assert.deepEqual(checkTerms([path], config), []);
});

test('Words in the documentation are outside the code scope', () => {
  const path = file('notes.md', 'Herald supports games beyond Magic.\n');
  assert.deepEqual(checkTerms([path], config), []);
});

// covers: repository-rules: A commit with a spelling in American English
test('An American spelling in Markdown prose is reported with its British form expected', () => {
  const path = file('prose.md', 'Each organization runs its tournaments.\n');
  const findings = checkSpelling([path]);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /"organization" is American/);
});

test('An American spelling inside inline code in Markdown is left alone', () => {
  const path = file('code.md', 'The HTML attribute `autocomplete="organization"` stays.\n');
  assert.deepEqual(checkSpelling([path]), []);
});

// covers: repository-rules: A package with a new licence
test('A package whose licence is not on the allowed list is reported with its name, version and licence', () => {
  const licences = { allowed: { MIT: 'Permissive.' }, packages: { Reviewed: { licence: 'MIT', reason: 'Read by hand.' } } };
  const findings = licenceFindings(
    {
      web: { web: { MIT: [{ name: 'fine', versions: ['1.0.0'] }], 'GPL-3.0': [{ name: 'copyleft', versions: ['2.1.0'] }] } },
      dotnet: [
        { id: 'Allowed', version: '1.0.0', licence: 'MIT' },
        { id: 'Unknown', version: '3.0.0', licence: undefined },
        { id: 'Reviewed', version: '4.0.0', licence: undefined },
      ],
    },
    licences,
  );
  assert.deepEqual(findings, [
    'web/pnpm-lock.yaml  licence: copyleft 2.1.0 is GPL-3.0, not on the allowed list.',
    'Directory.Packages.props  licence: Unknown 3.0.0 declares no licence expression; review it and add it to docs/rules/licences.json.',
  ]);
});

// covers: repository-rules: A bypassed hook is caught in CI
test('CI runs the rules on every file, so a commit made without the hooks still fails', () => {
  const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.match(workflow, /^\s+run: node scripts\/rules\.mjs\s*$/m);
});
