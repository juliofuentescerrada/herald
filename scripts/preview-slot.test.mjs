// The preview slot's guard (m4-deploy D-2): node --test scripts/preview-slot.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { decide } from './preview-slot.mjs';

const pullRequest = (number, ...labels) => ({ number, labels: labels.map((name) => ({ name })) });
const labeled = (number, name = 'preview') => ({ action: 'labeled', label: { name }, pull_request: pullRequest(number, name) });

// covers: deployment-pipeline: Labelling a pull request while the slot is free
test('Labelling a pull request while no other holds the slot deploys it', () => {
  assert.deepEqual(decide(labeled(7), [7]), { decision: 'deploy' });
});

// covers: deployment-pipeline: Labelling a pull request while another holds the slot
test('Labelling a pull request while another holds the slot refuses and names the holder', () => {
  assert.deepEqual(decide(labeled(8), [7, 8]), { decision: 'refuse', holder: 7 });
});

// covers: deployment-pipeline: A push to the holder redeploys it
test('A push to the pull request that holds the label redeploys it', () => {
  assert.deepEqual(decide({ action: 'synchronize', pull_request: pullRequest(7, 'preview') }, [7]), { decision: 'deploy' });
});

// covers: deployment-pipeline: Closing or removing the label releases the slot
test('Closing the holder or removing its label releases the slot, and the next label deploys', () => {
  assert.deepEqual(decide({ action: 'closed', pull_request: pullRequest(7, 'preview') }, []), { decision: 'release' });
  assert.deepEqual(decide({ action: 'unlabeled', label: { name: 'preview' }, pull_request: pullRequest(7) }, []), { decision: 'release' });
  assert.deepEqual(decide(labeled(8), [8]), { decision: 'deploy' });
});

test('Labelling a closed pull request leaves the slot alone', () => {
  const event = labeled(7);
  event.pull_request.state = 'closed';
  assert.deepEqual(decide(event, []), { decision: 'ignore' });
});

test('A labelled pull request reopened takes the slot again, or is refused while another holds it', () => {
  const reopened = { action: 'reopened', pull_request: pullRequest(7, 'preview') };
  assert.deepEqual(decide(reopened, [7]), { decision: 'deploy' });
  assert.deepEqual(decide(reopened, [7, 8]), { decision: 'refuse', holder: 8 });
  assert.deepEqual(decide({ action: 'reopened', pull_request: pullRequest(7) }, []), { decision: 'ignore' });
});

test('Events that do not concern the slot are ignored', () => {
  assert.deepEqual(decide(labeled(7, 'slice'), []), { decision: 'ignore' });
  assert.deepEqual(decide({ action: 'synchronize', pull_request: pullRequest(7) }, []), { decision: 'ignore' });
  assert.deepEqual(decide({ action: 'unlabeled', label: { name: 'slice' }, pull_request: pullRequest(7, 'preview') }, [7]), { decision: 'ignore' });
  assert.deepEqual(decide({ action: 'closed', pull_request: pullRequest(7) }, []), { decision: 'ignore' });
});

const temp = mkdtempSync(join(tmpdir(), 'herald-preview-slot-test-'));
after(() => rmSync(temp, { recursive: true, force: true }));

test('The command prints its decision in the format of GITHUB_OUTPUT', () => {
  writeFileSync(join(temp, 'event.json'), JSON.stringify(labeled(8)));
  writeFileSync(join(temp, 'holders.json'), JSON.stringify([{ number: 7 }, { number: 8 }]));
  const output = execFileSync('node', ['scripts/preview-slot.mjs', join(temp, 'event.json'), join(temp, 'holders.json')], { encoding: 'utf8' });
  assert.equal(output, 'decision=refuse\nholder=7\n');
});
