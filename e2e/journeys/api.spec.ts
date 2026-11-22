import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiScope, authority, pilotApplication, urls } from '../environment.ts';
import { createOrganisation, expect, test } from '../fixtures.ts';

// Journey 30 (h1-api-journey D-4): an independent client follows docs/api/individual-league.md with a pilot grant. The owner
// creates the organisation, grants the client every group and later reads the Standings page; everything else goes through the API.

interface Json {
  [key: string]: unknown;
}

const players = ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch'];

// Robin Vale wins all three; Sam Reed and Jamie Brook draw and each beats Taylor Finch (as journey 22).
const results: [string, string, 'first' | 'draw'][] = [
  ['Robin Vale', 'Taylor Finch', 'first'],
  ['Sam Reed', 'Jamie Brook', 'draw'],
  ['Robin Vale', 'Jamie Brook', 'first'],
  ['Sam Reed', 'Taylor Finch', 'first'],
  ['Robin Vale', 'Sam Reed', 'first'],
  ['Jamie Brook', 'Taylor Finch', 'first'],
];

/** The pilot application's API, as docs/api/individual-league.md describes it. */
const client = async (request: APIRequestContext, organisation: string) => {
  const token = await request.post(`${authority}/token`, {
    form: { grant_type: 'client_credentials', client_id: pilotApplication.clientId, client_secret: 'not-checked', scope: apiScope },
  });
  expect(token.ok()).toBe(true);
  const headers = { Authorization: `Bearer ${((await token.json()) as Json)['access_token']}` };
  const base = `${urls.host}/api/organisations/${organisation}`;
  const send = (method: 'post' | 'put', path: string, data: object, operation: string = randomUUID()) =>
    request[method](`${base}${path}`, { headers: { ...headers, 'Operation-Id': operation }, data });
  const read = async (path: string): Promise<Json> => {
    const response = await request.get(`${base}${path}`, { headers });
    expect(response.status(), `GET ${path}`).toBe(200);
    return (await response.json()) as Json;
  };
  /** Reads until the other modules have caught up with the last write: they follow it through durable queues. */
  const until = async (path: string, ready: (body: Json) => boolean): Promise<Json> => {
    let body: Json = {};
    await expect
      .poll(async () => {
        // A resource another module has not created yet answers 404 until it has.
        const response = await request.get(`${base}${path}`, { headers });
        return response.ok() && ready((body = (await response.json()) as Json));
      }, { timeout: 15_000 })
      .toBe(true);
    return body;
  };
  const ok = async (response: APIResponse, status = 200): Promise<Json> => {
    expect(response.status(), await response.text()).toBe(status);
    return (await response.json()) as Json;
  };
  return { send, read, until, ok };
};

const name = (match: Json, side: 'first' | 'second') => (match[side] as Json)['name'] as string;

test('An independent client runs a four-player league through the API, repeats a result after losing the response and gets the original receipt, and reads the same final standings as the admin application', {
  annotation: { type: 'covers', description: 'api-description: An independent client' },
}, async ({
  page,
  request,
  signIn,
  expectAccessible,
}) => {
  // The owner's part: an organisation, and a grant of every group for all of its tournaments.
  await signIn();
  const organisation = await createOrganisation(page);
  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  await page.getByRole('button', { name: 'Grant access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Grant access' });
  await dialog.getByLabel('Name', { exact: true }).fill('League client');
  await dialog.getByLabel('Application identifier', { exact: true }).fill(pilotApplication.oid);
  for (const group of ['Read', 'Tournament setup', 'Entries', 'Schedule', 'Results and corrections', 'Finalisation']) {
    await dialog.getByRole('checkbox', { name: new RegExp(`^${group} ·`) }).check();
  }
  await dialog.getByRole('button', { name: 'Grant access' }).click();
  await expect(page.getByText('League client can act within its grant.')).toBeVisible();

  // The client's part, step by step as the worked example.
  const api = await client(request, organisation.id);
  const tournament = randomUUID();
  const path = `/tournaments/${tournament}`;
  const configuration = {
    title: 'API League',
    gameVariant: 'Example strategy · Standard variant',
    entryKind: 'individual',
    capacity: 4,
    registrationOpensAt: '2026-11-10T09:00:00',
    registrationClosesAt: '2026-11-13T18:00:00',
    plannedStartAt: '2026-11-14T10:00:00',
    timeZone: 'Europe/Madrid',
    location: 'online',
    admission: 'automatic',
    checkIn: 'optional',
    visibility: 'private',
  };
  await api.ok(await api.send('post', '/tournaments', { tournamentId: tournament, configuration }), 201);
  await api.ok(await api.send('post', `${path}/publication`, { expectedRevision: 1 }));
  await api.ok(await api.send('post', `${path}/registration/opening`, { expectedRevision: 2 }));
  await api.until(`${path}/entries`, (field) => (field['terms'] as Json)['registration'] === 'open');

  for (const player of players) {
    const guest = randomUUID();
    await api.ok(await api.send('put', `/guests/${guest}`, { kind: 'player', name: player, confirmNew: true }));
    await api.ok(await api.send('put', `${path}/entries/${randomUUID()}`, { guestId: guest }));
  }
  const admitted = await api.until(path, (details) => details['admittedEntries'] === 4);
  await api.ok(await api.send('post', `${path}/registration/closure`, { expectedRevision: admitted['revision'] }));

  const closed = await api.until(`${path}/schedule`, (schedule) => schedule['registrationClosed'] === true && schedule['eligible'] === 4);
  // A command that carries its operation identity in its body sends the same one in the header.
  const drafting = randomUUID();
  const draft = await api.ok(await api.send('post', `${path}/schedule/draft`, { operationId: drafting, expectedRevision: closed['revision'], seeding: 'admissionOrder' }, drafting));
  await api.ok(await api.send('post', `${path}/schedule/publication`, { expectedRevision: draft['revision'] }));
  const ready = await api.until(path, (details) => details['schedulePublished'] === true);
  await api.ok(await api.send('post', `${path}/competition/start`, { expectedRevision: ready['revision'] }));

  const running = await api.until(`${path}/schedule`, (schedule) => (schedule['matches'] as Json[]).length === 6);
  const matches = running['matches'] as Json[];
  expect(matches).toHaveLength(6);
  for (const [index, [winner, other, outcome]] of results.entries()) {
    const match = matches.find((m) => [name(m, 'first'), name(m, 'second')].sort().join() === [winner, other].sort().join())!;
    const result = `${path}/matches/${match['matchId']}/result`;
    const operation = randomUUID();
    const body = { operationId: operation, expectedRevision: 1, outcome: outcome === 'draw' ? 'draw' : name(match, 'first') === winner ? 'first' : 'second' };
    const first = await api.send('post', result, body, operation);
    if (index !== 3) {
      await api.ok(first);
      continue;
    }

    // The fourth response is lost: the receipt says what happened, and the repeat returns the original without a second effect.
    const receipt = await api.read(`/receipts/${operation}`);
    expect(receipt).toMatchObject({ operationId: operation, operation: 'recordResult', outcome: 'applied', resource: `/api/organisations/${organisation.id}${result}` });
    const repeated = await api.ok(await api.send('post', result, body, operation));
    expect(repeated['revision']).toBe(receipt['revision']);
    expect(await first.text()).toBe(JSON.stringify(repeated));
  }

  const resolved = await api.until(`${path}/schedule`, (schedule) => (schedule['matches'] as Json[]).every((m) => m['result'] !== null));
  await api.until(`${path}/standings`, (standings) => standings['revision'] === resolved['resultsRevision']);
  await api.ok(await api.send('post', `${path}/finalisation`, { reviewedRevision: resolved['resultsRevision'], expectedRevision: resolved['revision'] }));
  const standings = await api.until(`${path}/standings`, (view) => view['final'] !== null);
  const rows = (standings['rows'] as Json[]).map((row) => [(row['entrant'] as Json)['name'], row['points']]);
  expect(rows).toEqual([['Robin Vale', 9], ['Jamie Brook', 4], ['Sam Reed', 4], ['Taylor Finch', 0]]);

  // The admin application shows the same final standings.
  await page.goto(`/organisations/${organisation.id}/tournaments/${tournament}/standings`);
  await expect(page.getByText('Final · 6 of 6 matches resolved')).toBeVisible();
  const table = page.getByRole('table', { name: 'Standings' });
  for (const [index, [player, points]] of rows.entries()) {
    const row = table.getByRole('row').nth(index + 1);
    await expect(row.getByRole('button', { name: player as string })).toBeVisible();
    await expect(row.getByRole('cell').last()).toHaveText(String(points));
  }
  await expectAccessible();
});
