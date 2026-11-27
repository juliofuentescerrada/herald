#!/usr/bin/env node
// Decides what a pull request event does to the `preview` slot (m4-deploy D-2): deploy, refuse, release or ignore.
// deploy.yml runs it; the decision lives here only, so a Node test covers each case.
//
//   node scripts/preview-slot.mjs <event.json> <holders.json>   prints decision=… and holder=…, the format of $GITHUB_OUTPUT
//
// <event.json> is the pull_request event ($GITHUB_EVENT_PATH); <holders.json> the open pull requests with the label,
// as `gh pr list --label preview --state open --json number` prints them.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const label = 'preview';

const hasLabel = (pullRequest) => (pullRequest.labels ?? []).some((candidate) => candidate.name === label);

// holders: the numbers of the open pull requests with the label. A refused pull request loses its label (deploy.yml),
// so at most one other holder exists.
export function decide(event, holders) {
  const pullRequest = event.pull_request;
  const others = holders.filter((number) => number !== pullRequest.number);
  switch (event.action) {
    case 'labeled':
      if (event.label?.name !== label) return { decision: 'ignore' };
      return others.length ? { decision: 'refuse', holder: others[0] } : { decision: 'deploy' };
    // A holder closed and reopened keeps its label: it takes the slot again, or is refused like a new label.
    case 'reopened':
      if (!hasLabel(pullRequest)) return { decision: 'ignore' };
      return others.length ? { decision: 'refuse', holder: others[0] } : { decision: 'deploy' };
    case 'synchronize':
      return hasLabel(pullRequest) && !others.length ? { decision: 'deploy' } : { decision: 'ignore' };
    case 'unlabeled':
      return event.label?.name === label ? { decision: 'release' } : { decision: 'ignore' };
    case 'closed':
      return hasLabel(pullRequest) ? { decision: 'release' } : { decision: 'ignore' };
    default:
      return { decision: 'ignore' };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [eventPath, holdersPath] = process.argv.slice(2);
  if (!eventPath || !holdersPath) {
    console.error('Usage: node scripts/preview-slot.mjs <event.json> <holders.json>');
    process.exit(2);
  }
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const holders = JSON.parse(readFileSync(holdersPath, 'utf8')).map((pullRequest) => pullRequest.number);
  const { decision, holder } = decide(event, holders);
  console.log(`decision=${decision}`);
  console.log(`holder=${holder ?? ''}`);
}
