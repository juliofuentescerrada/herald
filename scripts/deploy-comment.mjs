#!/usr/bin/env node
// The pull request comment of a preview deployment (m4-deploy D-7): where to test and as whom, never an identifier.
//
//   node scripts/deploy-comment.mjs <outputs.json> <commit>   prints the comment's Markdown
//
// <outputs.json> is `tofu output -json`, whose values hold names and addresses only (infra/outputs.tf).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './rules.mjs';

// The seed tool's default persona names: the one source is tools/Herald.Seed/Personas.cs.
export function personaNames(source = readFileSync(join(root, 'tools', 'Herald.Seed', 'Personas.cs'), 'utf8')) {
  const main = source.match(/Read\(configuration, Main, "([^"]+)"\)/)?.[1];
  const rival = source.match(/_defaultRival = new\(Rival,[^;]*"([^"]+)"\);/)?.[1];
  if (!main || !rival) throw new Error('The persona names were not found in tools/Herald.Seed/Personas.cs.');
  return { main, rival };
}

export function comment({ public: publicUrl, admin }, commit, personas = personaNames()) {
  return [
    `### Deployed to \`preview\` (${commit.slice(0, 7)})`,
    '',
    `- Public site: ${publicUrl}`,
    `- Organiser workspace: ${admin}`,
    '',
    `Sign in as **${personas.main}** (the owner) or **${personas.rival}** (an owner of another organisation), with the passwords in the maintainer's password manager.`,
    `The data was reset and seeded with the scenarios of \`tools/Herald.Seed/Scenarios.cs\`. The slice's test script is in \`e2e/scripts/\`, and its screens are this pull request's \`test-script-screens\` artefact.`,
    '',
    'Removing the `preview` label or closing this pull request releases the slot.',
  ].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [outputsPath, commit] = process.argv.slice(2);
  if (!outputsPath || !commit) {
    console.error('Usage: node scripts/deploy-comment.mjs <outputs.json> <commit>');
    process.exit(2);
  }
  const outputs = JSON.parse(readFileSync(outputsPath, 'utf8'));
  console.log(comment(outputs.slots.value.preview.urls, commit));
}
