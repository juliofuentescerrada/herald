#!/usr/bin/env node
// Every specified scenario has a test (harness-engineering, spec-traceability).
//
//   node scripts/spec-coverage.mjs           fail on uncovered scenarios outside the baseline, stale baseline
//                                            entries and markers that name no scenario
//   node scripts/spec-coverage.mjs --list    print the uncovered scenarios, one per line
//
// Markers, each "<capability>: <scenario title>":
//   .NET (xunit)      [Trait("covers", "team-rosters: An owner adds a player to a waiting team")]
//   Playwright        test('…', { annotation: { type: 'covers', description: 'team-rosters: …' } }, …)
//   Vitest            it('…', { meta: { type: 'covers', description: 'team-rosters: …' } }, …)  (typed by web/projects/admin/src/covers.d.ts)
//   Node test files   // covers: team-rosters: …
// The baseline, docs/rules/uncovered-scenarios.txt, holds the scenarios uncovered when traceability began; it only shrinks.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = 'docs/rules/uncovered-scenarios.txt';
const tracked = () => execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);

// "<capability>: <title>" for every scenario of the given spec files.
export function scenariosOf(specFiles, read = (file) => readFileSync(join(root, file), 'utf8')) {
  const scenarios = new Set();
  for (const file of specFiles) {
    const capability = file.split('/').at(-2);
    for (const [, title] of read(file).matchAll(/^#### Scenario:\s*(.+?)\s*$/gm)) scenarios.add(`${capability}: ${title}`);
  }
  return scenarios;
}

// One marker form per kind of test file, so an example inside another kind's string is not read as a marker.
const markerPatterns = [
  [/\.cs$/, /\[Trait\(\s*"covers"\s*,\s*"([^"]+)"\s*\)\]/g],
  // The closing quote matches the opening one, so a title may contain the other kind (an apostrophe).
  [/\.ts$/, /type:\s*['"]covers['"]\s*,\s*description:\s*(?:"([^"]+)"|'([^']+)')/g],
  [/\.mjs$/, /^\s*\/\/\s*covers:\s*(.+?)\s*$/gm],
];

// Marker → the files that carry it.
export function markersOf(testFiles, read = (file) => readFileSync(join(root, file), 'utf8')) {
  const markers = new Map();
  for (const file of testFiles) {
    const text = read(file);
    for (const [kind, pattern] of markerPatterns) {
      if (!kind.test(file)) continue;
      for (const [, ...groups] of text.matchAll(pattern)) {
        const marker = groups.find((group) => group !== undefined).trim();
        markers.set(marker, [...(markers.get(marker) ?? []), file]);
      }
    }
  }
  return markers;
}

export function evaluate({ specified, proposed, markers, baseline }) {
  const findings = [];
  const covered = new Set(markers.keys());
  for (const scenario of specified) {
    if (!covered.has(scenario) && !baseline.has(scenario)) findings.push(`uncovered: ${scenario}  (no test marks it; add a covers marker to the test that proves it)`);
    if (covered.has(scenario) && baseline.has(scenario)) findings.push(`now covered, remove from ${baselinePath}: ${scenario}`);
  }
  for (const [marker, files] of markers) {
    if (!specified.has(marker) && !proposed.has(marker)) findings.push(`dangling marker in ${files.join(', ')}: ${marker}  (no scenario has this title)`);
  }
  for (const entry of baseline) {
    if (!specified.has(entry)) findings.push(`stale baseline entry, remove it from ${baselinePath}: ${entry}`);
  }
  return findings;
}

export function collect() {
  const files = tracked();
  const specified = scenariosOf(files.filter((file) => /^openspec\/specs\/[^/]+\/spec\.md$/.test(file)));
  const proposed = scenariosOf(files.filter((file) => /^openspec\/changes\/(?!archive\/)[^/]+\/specs\/[^/]+\/spec\.md$/.test(file)));
  const tests = files.filter(
    (file) => /^tests\/.*\.cs$/.test(file) || /^e2e\/.*\.ts$/.test(file) || /^web\/projects\/.*\.spec\.ts$/.test(file) || /^scripts\/.*\.test\.mjs$/.test(file),
  );
  const markers = markersOf(tests.filter((file) => existsSync(join(root, file))));
  const baseline = new Set(
    existsSync(join(root, baselinePath))
      ? readFileSync(join(root, baselinePath), 'utf8').split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
      : [],
  );
  return { specified, proposed, markers, baseline };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const state = collect();
  if (process.argv.includes('--list')) {
    for (const scenario of [...state.specified].filter((scenario) => !state.markers.has(scenario)).sort()) console.log(scenario);
    process.exit(0);
  }
  const findings = evaluate(state);
  for (const finding of findings) console.log(finding);
  const covered = [...state.specified].filter((scenario) => state.markers.has(scenario)).length;
  console.log(`${covered} of ${state.specified.size} scenarios covered; ${state.baseline.size} in the baseline.`);
  process.exit(findings.length === 0 ? 0 : 1);
}
