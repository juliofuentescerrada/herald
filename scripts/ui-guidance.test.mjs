import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

const read = (path) => readFileSync(join(root, path), 'utf8');
const components = 'docs/ui/components.md';
const icons = 'docs/ui/icons.md';
const guide = 'docs/ui/style-guide.md';
const review = 'openspec/changes/style-guide-and-ui-audit/reviews/existing-screens.md';

// covers: interface-guidance: A public UI export is documented
test('Every public UI export has usage documentation, and every control has an intent and contract', () => {
  const api = read('web/projects/ui/src/public-api.ts');
  const documentation = read(components);
  for (const declaration of api.matchAll(/export\s+(type\s+)?\{([^}]+)\}/g)) {
    for (const name of declaration[2].split(',').map((name) => name.trim())) {
      assert.match(documentation, new RegExp(`\\b${name}\\b`), `Document the public export ${name} in ${components}`);
      if (declaration[1] || name === 'toastDuration') continue;
      const section = documentation.split(`\n## ${name}\n`)[1]?.split(/\n## /)[0];
      assert.ok(section, `${name} needs its own usage entry`);
      assert.match(section, /\*\*Intent:\*\*/);
      assert.match(section, /\*\*Contract:\*\*/);
      assert.match(section, /\*\*Avoid:\*\*/);
      assert.match(section, /```(?:html|typescript)\n/, `${name} needs an integration example`);
    }
  }
  assert.match(documentation, /## Native and feature-owned patterns/);
  assert.match(documentation, /not exported components/);
  assert.match(read(guide), /herald-visual-direction\.md/);
});

// covers: interface-guidance: A registered icon is documented
test('Every registered icon and size has a documented meaning and accessible usage', () => {
  const source = read('web/projects/ui/src/lib/icon.ts');
  const documentation = read(icons);
  const registry = source.match(/const icons = \{([\s\S]*?)\} as const;/)?.[1];
  assert.ok(registry, 'Read the typed icon registry');
  for (const [, name] of registry.matchAll(/^\s*['"]?([\w-]+)['"]?:/gm)) {
    assert.ok(documentation.includes(`| \`${name}\` |`), `Document the meaning of ${name} in ${icons}`);
  }
  const sizes = source.match(/const sizes = \{([^}]+)\}/)?.[1];
  assert.ok(sizes, 'Read the size registry');
  for (const [, name, pixels] of sizes.matchAll(/(\w+):\s*(\d+)/g)) {
    assert.ok(documentation.includes(`| \`${name}\` | ${pixels} |`), `Document the use of ${name} (${pixels})`);
  }
  for (const concept of ['aria-hidden', 'aria-label', 'stroke', 'text only', 'drawer', 'Extending the registry']) {
    assert.ok(documentation.includes(concept), `Document ${concept}`);
  }
});

// covers: agent-harness: A fresh agent finds the UI guidance
test('Claude Code, Codex and OpenSpec route UI work to the same local skill and documentation', () => {
  for (const name of ['herald-screens', 'herald-docs', 'refactoring-ui']) {
    const canonical = `.claude/skills/${name}/SKILL.md`;
    const codex = `.agents/skills/${name}/SKILL.md`;
    assert.equal(realpathSync(join(root, codex)), realpathSync(join(root, canonical)), `${codex} must resolve to the canonical source`);
    assert.ok(read('AGENTS.md').includes(codex));
  }
  for (const path of ['CLAUDE.md', 'web/CLAUDE.md', '.claude/skills/herald-screens/SKILL.md', 'openspec/config.yaml']) {
    assert.ok(read(path).includes('refactoring-ui'), `${path} routes to the practice skill`);
    assert.ok(read(path).includes(guide), `${path} routes to the guide`);
  }
  for (const path of ['web/CLAUDE.md', '.claude/skills/herald-screens/SKILL.md', 'openspec/config.yaml']) {
    for (const document of [components, icons]) assert.ok(read(path).includes(document), `${path} routes to ${document}`);
  }
  const practice = read('.claude/skills/refactoring-ui/SKILL.md');
  assert.match(practice, /^name: refactoring-ui$/m);
  assert.ok(practice.includes('https://www.refactoringui.com/'));
  assert.match(practice, /not an official upstream skill/);
  assert.match(practice, /No plugin installation/);
  const settings = JSON.parse(read('.claude/settings.json'));
  assert.ok(!Object.keys(settings.enabledPlugins ?? {}).some((name) => /impeccable/i.test(name)));
});

// covers: interface-guidance: Reading the existing-screen review
test('The guide links an audit with explicit inventory, evidence, findings and verification limits', () => {
  assert.ok(read(guide).includes(review));
  const audit = read(review);
  for (const heading of ['Baseline and method', 'Screen and state inventory', 'Findings', 'Executed checks', 'Remaining verification', 'Remediation order']) {
    assert.ok(audit.includes(`## ${heading}`), `The audit needs ${heading}`);
  }
  for (const scope of ['admin', 'public', 'catalogue', 'fixture', 'overlay', 'source', 'browser']) assert.ok(audit.includes(scope), scope);
  for (const field of ['Criterion', 'Evidence', 'Trigger', 'Correction', 'Disposition']) assert.ok(audit.includes(field), field);
  assert.match(audit, /not verified/i);
  assert.match(audit, /production.*(?:separate|follow-up)/i);
  for (let number = 1; number <= 12; number++) assert.ok(read(guide).includes(`G-${String(number).padStart(2, '0')}`));
});
