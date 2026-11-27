// The deployment workflow's steps (m4-deploy D-1, D-3): node --test scripts/deploy.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { root } from './rules.mjs';

const workflow = readFileSync(join(root, '.github', 'workflows', 'deploy.yml'), 'utf8');
const script = readFileSync(join(root, 'deploy', 'deploy-slot'), 'utf8');
// Each job's block under `jobs:`, keyed by its name, as ci-changes.test.mjs reads the CI workflows.
const jobs = Object.fromEntries(
  workflow.slice(workflow.indexOf('\njobs:\n')).split(/\n(?= {2}[a-z][\w-]*:\n)/).slice(1).map((block) => [block.match(/^ {2}([\w-]+):/)[1], block]),
);

test('The workflow deploys main on a merge and guards preview on pull requests', () => {
  assert.deepEqual(Object.keys(jobs), ['guard', 'main', 'preview']);
  assert.match(workflow, /push:\n {4}branches: \[main\]/);
  assert.match(workflow, /pull_request:\n {4}types: \[labeled, synchronize, unlabeled, closed\]/);
  assert.match(jobs.guard, /node scripts\/preview-slot\.mjs/);
  assert.match(jobs.guard, /head\.repo\.full_name == github\.repository/, 'a fork never reaches the slot');
});

// covers: deployment-pipeline: The main deployment's steps
test('main deploys in its environment, applies the infrastructure and seeds without a reset before the apps', () => {
  assert.match(jobs.main, /environment: main\n/);
  assert.match(jobs.main, /tofu -chdir=infra apply /);
  assert.ok(jobs.main.indexOf('tofu -chdir=infra apply') < jobs.main.indexOf('deploy/deploy-slot main'), 'the infrastructure first');
  assert.match(jobs.main, /group: deploy-main\n {6}cancel-in-progress: false/);
  // A reset of main only from the manual input.
  assert.match(jobs.main, /reset: \$\{\{ inputs\.reset && '--reset' \|\| '' \}\}/);
  // The script waits for the job before it changes any app.
  assert.ok(script.indexOf('az containerapp job start') < script.indexOf('az containerapp update'), 'the job before the apps');
  assert.match(script, /Failed \| Stopped \| Degraded\)[\s\S]*?exit 1/, 'a failed job stops the deployment');
});

// covers: deployment-pipeline: The preview deployment's steps
test('preview deploys in its environment, only after the guard, and never applies the infrastructure', () => {
  assert.match(jobs.preview, /environment: preview\n/);
  assert.match(jobs.preview, /needs: guard\n {4}if: needs\.guard\.outputs\.decision == 'deploy'/);
  assert.doesNotMatch(jobs.preview, /tofu[^\n]* apply/);
  assert.match(jobs.preview, /deploy\/deploy-slot preview /);
  assert.match(jobs.preview, /group: deploy-preview\n {6}cancel-in-progress: false/);
});
