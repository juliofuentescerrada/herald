// The spec-traceability spec for scripts/spec-coverage.mjs: node --test scripts/*.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate, markersOf, scenariosOf } from './spec-coverage.mjs';

const spec = (titles) => titles.map((title) => `#### Scenario: ${title}`).join('\n');
const state = ({ specified = [], proposed = [], markers = {}, baseline = [] }) => ({
  specified: new Set(specified),
  proposed: new Set(proposed),
  markers: new Map(Object.entries(markers)),
  baseline: new Set(baseline),
});

// covers: spec-traceability: A marked test
test('Markers in .NET, Playwright and Node tests are read as capability and scenario', () => {
  const files = {
    'tests/A.cs': '[Trait("covers", "team-rosters: An owner adds a player to a waiting team")]',
    'e2e/journeys/b.spec.ts': "test('x', { annotation: { type: 'covers', description: 'sign-in: Signing in' } }, async () => {});",
    'scripts/c.test.mjs': '// covers: repository-rules: A marked rule',
  };
  const markers = markersOf(Object.keys(files), (file) => files[file]);
  assert.deepEqual([...markers.keys()].sort(), ['repository-rules: A marked rule', 'sign-in: Signing in', 'team-rosters: An owner adds a player to a waiting team']);
});

test('A Playwright marker in double quotes keeps an apostrophe in its title', () => {
  const file = `test('x', { annotation: { type: 'covers', description: "agent-harness: Checking a slice before the maintainer's test round" } }, async () => {});`;
  assert.deepEqual([...markersOf(['e2e/scripts/x.spec.ts'], () => file).keys()], ["agent-harness: Checking a slice before the maintainer's test round"]);
});

test('Scenarios take their capability from the spec folder', () => {
  const scenarios = scenariosOf(['openspec/specs/team-rosters/spec.md'], () => spec(['One', 'Two']));
  assert.deepEqual([...scenarios], ['team-rosters: One', 'team-rosters: Two']);
});

// covers: spec-traceability: An archived change adds an uncovered scenario
test('A scenario neither marked nor in the baseline is reported', () => {
  const findings = evaluate(state({ specified: ['team-rosters: New'] }));
  assert.match(findings[0], /^uncovered: team-rosters: New/);
});

// covers: spec-traceability: A renamed scenario
test('A marker whose scenario was renamed is reported with its test', () => {
  const findings = evaluate(state({ specified: ['team-rosters: Renamed'], markers: { 'team-rosters: Old': ['tests/A.cs'] }, baseline: ['team-rosters: Renamed'] }));
  assert.deepEqual(findings, ['dangling marker in tests/A.cs: team-rosters: Old  (no scenario has this title)']);
});

// covers: spec-traceability: Covering a scenario from the baseline
test('A covered scenario still in the baseline must be removed from it', () => {
  const findings = evaluate(state({ specified: ['team-rosters: Old gap'], markers: { 'team-rosters: Old gap': ['tests/A.cs'] }, baseline: ['team-rosters: Old gap'] }));
  assert.match(findings[0], /^now covered, remove from/);
});

test('A marker for a scenario of an active change is accepted before the change is archived', () => {
  assert.deepEqual(evaluate(state({ proposed: ['harness: Proposed'], markers: { 'harness: Proposed': ['scripts/c.test.mjs'] } })), []);
});
