// The preview deployment's pull request comment (m4-deploy D-7): node --test scripts/deploy-comment.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { comment, personaNames } from './deploy-comment.mjs';

const urls = { public: 'https://ca-herald-preview-public.example.azurecontainerapps.io', admin: 'https://ca-herald-preview-admin.example.azurecontainerapps.io' };

// covers: deployment-pipeline: The pull request comment carries no identifiers
test('The comment names both addresses and both personas, and carries no identifier or password', () => {
  const text = comment(urls, '0123456789abcdef0123456789abcdef01234567');

  assert.match(text, new RegExp(urls.public.replaceAll('.', '\\.')));
  assert.match(text, new RegExp(urls.admin.replaceAll('.', '\\.')));
  const { main, rival } = personaNames();
  assert.ok(text.includes(main) && text.includes(rival), 'both personas by name');
  assert.doesNotMatch(text, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, 'no object id or directory id');
  assert.doesNotMatch(text, /password\s*[:=]/i, 'no password');
});

test('The persona names come from the seed tool', () => {
  assert.deepEqual(personaNames(), { main: 'Avery Quinn', rival: 'Rowan Ellis' });
});
