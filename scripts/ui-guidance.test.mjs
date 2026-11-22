import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

const read = (path) => readFileSync(join(root, path), 'utf8');
const components = 'docs/ui/components.md';
const icons = 'docs/ui/icons.md';
const guide = 'docs/ui/style-guide.md';
const experiences = 'docs/ui/experience-patterns.md';

function publicExports(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  const named = /export\s+(type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]\s*;/g;
  const declarations = [...code.matchAll(named)];
  assert.equal(code.replace(named, '').trim(), '', 'Extend the documentation inventory check before using another public export syntax');
  assert.ok(declarations.length, 'The public API declares named exports');
  for (const declaration of declarations) {
    for (const name of declaration[2].split(',').map((name) => name.trim())) {
      assert.match(name, /^[A-Za-z_$][\w$]*$/, 'Extend the inventory check before using export aliases or inline type modifiers');
    }
  }
  return declarations;
}

// covers: interface-guidance: A public UI export is documented
test('Every public UI export has usage documentation, and every control has an intent and contract', () => {
  const api = read('web/projects/ui/src/public-api.ts');
  const documentation = read(components);
  for (const declaration of publicExports(api)) {
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

test('Unsupported public export forms cannot bypass the documentation inventory', () => {
  const existing = "export { Button } from './lib/button';\n";
  for (const extra of ["export * from './lib/new-control';", 'export class NewControl {}', "export { Hidden as NewControl } from './lib/new-control';"]) {
    assert.throws(() => publicExports(existing + extra), /Extend the/);
  }
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
  const link = read(guide).match(/\]\(([^)]+\/reviews\/existing-screens\.md)\)/)?.[1];
  assert.ok(link, 'The style guide links its dated existing-screen review');
  const audit = readFileSync(resolve(dirname(join(root, guide)), link), 'utf8');
  for (const heading of ['Baseline and method', 'Screen and state inventory', 'Findings', 'Executed checks', 'Remaining verification', 'Remediation order']) {
    assert.ok(audit.includes(`## ${heading}`), `The audit needs ${heading}`);
  }
  for (const scope of ['admin', 'public', 'catalogue', 'fixture', 'overlay', 'source', 'browser']) assert.ok(audit.includes(scope), scope);
  for (const field of ['Criterion', 'Evidence', 'Trigger', 'Correction', 'Disposition']) assert.ok(audit.includes(field), field);
  assert.match(audit, /not verified/i);
  assert.match(audit, /production.*(?:separate|follow-up)/i);
  for (let number = 1; number <= 12; number++) assert.ok(read(guide).includes(`G-${String(number).padStart(2, '0')}`));
});

// covers: interface-guidance: An agent designs an H2 public or participant task
test('UI routing includes audience-specific H2 patterns and separates target UX from feature approval', () => {
  const document = read(experiences);
  for (const word of ['organiser', 'participant', 'public', 'representative', 'not implemented', 'D-30', 'D-38']) {
    assert.ok(document.includes(word), `The experience reference covers ${word}`);
  }
  for (let number = 1; number <= 9; number++) assert.ok(document.includes(`## XP-${String(number).padStart(2, '0')}`));
  for (const heading of ['Supplied-document traceability and scope', 'H2 design review and handoff']) {
    assert.ok(document.includes(`## ${heading}`));
  }
  for (const concept of ['calendar/ICS', 'magic link', 'wizard', 'CRM', 'global public', 'confirmation by silence']) {
    assert.ok(document.toLowerCase().includes(concept.toLowerCase()), `The source aspiration/boundary for ${concept} is explicit`);
  }
  for (const path of ['AGENTS.md', 'CLAUDE.md', 'web/CLAUDE.md', '.claude/skills/herald-screens/SKILL.md', 'openspec/config.yaml']) {
    assert.ok(read(path).includes(experiences), `${path} routes to audience-specific UX`);
  }
  assert.ok(read(guide).includes('experience-patterns.md'));
  assert.ok(read(components).includes('experience-patterns.md'));
  assert.ok(read(icons).includes('experience-patterns.md'));
});
