import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiScope, authority, pilotApplication, urls } from './environment.ts';

// An independent client's four-player league, step by step as docs/api/individual-league.md (h1-api-journey D-4): journey 30 and
// its test script both run it, after an owner has granted the pilot application every group for all the organisation's tournaments.

export interface Json {
  [key: string]: unknown;
}

/** One request and its response, for a test script's text captures. */
export type Exchange = (step: string, request: string, response: string) => Promise<void>;

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

const client = async (request: APIRequestContext, organisation: string, exchange?: Exchange) => {
  const token = await request.post(`${authority}/token`, {
    form: { grant_type: 'client_credentials', client_id: pilotApplication.clientId, client_secret: 'not-checked', scope: apiScope },
  });
  expect(token.ok()).toBe(true);
  const headers = { Authorization: `Bearer ${((await token.json()) as Json)['access_token']}` };
  const base = `${urls.host}/api/organisations/${organisation}`;
  const capture = async (step: string | undefined, line: string, data: object | undefined, response: APIResponse) => {
    if (step && exchange) {
      await exchange(step, `${line}\n${data ? JSON.stringify(data, null, 2) : ''}`, `${response.status()}\n${JSON.stringify(await response.json(), null, 2)}`);
    }
    return response;
  };
  const send = async (method: 'post' | 'put', path: string, data: object, operation: string = randomUUID(), step?: string) =>
    capture(step, `${method.toUpperCase()} ${path}\nOperation-Id: ${operation}`, data,
      await request[method](`${base}${path}`, { headers: { ...headers, 'Operation-Id': operation }, data }));
  const read = async (path: string, step?: string): Promise<Json> => {
    const response = await capture(step, `GET ${path}`, undefined, await request.get(`${base}${path}`, { headers }));
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

/** Runs the league and returns its tournament and final standings rows as [name, points]. */
export const runLeague = async (request: APIRequestContext, organisation: string, exchange?: Exchange) => {
  const api = await client(request, organisation, exchange);
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
  await api.ok(await api.send('post', '/tournaments', { tournamentId: tournament, configuration }, randomUUID(), 'create-tournament'), 201);
  await api.ok(await api.send('post', `${path}/publication`, { expectedRevision: 1 }, randomUUID(), 'publish'));
  await api.ok(await api.send('post', `${path}/registration/opening`, { expectedRevision: 2 }, randomUUID(), 'open-registration'));
  await api.until(`${path}/entries`, (field) => (field['terms'] as Json)['registration'] === 'open');

  for (const [index, player] of players.entries()) {
    const guest = randomUUID();
    await api.ok(await api.send('put', `/guests/${guest}`, { kind: 'player', name: player, confirmNew: true }, randomUUID(), index === 0 ? 'create-guest' : undefined));
    await api.ok(await api.send('put', `${path}/entries/${randomUUID()}`, { guestId: guest }, randomUUID(), index === 0 ? 'enter-guest' : undefined));
  }
  const admitted = await api.until(path, (details) => details['admittedEntries'] === 4);
  await api.ok(await api.send('post', `${path}/registration/closure`, { expectedRevision: admitted['revision'] }, randomUUID(), 'close-registration'));

  const closed = await api.until(`${path}/schedule`, (schedule) => schedule['registrationClosed'] === true && schedule['eligible'] === 4);
  // A command that carries its operation identity in its body sends the same one in the header.
  const drafting = randomUUID();
  const draft = await api.ok(await api.send('post', `${path}/schedule/draft`,
    { operationId: drafting, expectedRevision: closed['revision'], seeding: 'admissionOrder' }, drafting, 'generate-draft'));
  await api.ok(await api.send('post', `${path}/schedule/publication`, { expectedRevision: draft['revision'] }, randomUUID(), 'publish-schedule'));
  const ready = await api.until(path, (details) => details['schedulePublished'] === true);
  await api.ok(await api.send('post', `${path}/competition/start`, { expectedRevision: ready['revision'] }, randomUUID(), 'start'));

  const running = await api.until(`${path}/schedule`, (schedule) => (schedule['matches'] as Json[]).length === 6);
  const matches = running['matches'] as Json[];
  for (const [index, [winner, other, outcome]] of results.entries()) {
    const match = matches.find((m) => [name(m, 'first'), name(m, 'second')].sort().join() === [winner, other].sort().join())!;
    const result = `${path}/matches/${match['matchId']}/result`;
    const operation = randomUUID();
    const body = { operationId: operation, expectedRevision: 1, outcome: outcome === 'draw' ? 'draw' : name(match, 'first') === winner ? 'first' : 'second' };
    if (index !== 3) {
      await api.ok(await api.send('post', result, body, operation, index === 0 ? 'record-result' : undefined));
      continue;
    }

    // The fourth response is lost: the receipt says what happened, and the repeat returns the original without a second effect.
    const lost = await api.send('post', result, body, operation);
    const receipt = await api.read(`/receipts/${operation}`, 'receipt-of-the-lost-result');
    expect(receipt).toMatchObject({ operationId: operation, operation: 'recordResult', outcome: 'applied', resource: `/api/organisations/${organisation}${result}` });
    const repeated = await api.ok(await api.send('post', result, body, operation, 'repeat-the-lost-result'));
    expect(repeated['revision']).toBe(receipt['revision']);
    expect(await lost.text()).toBe(JSON.stringify(repeated));
  }

  const resolved = await api.until(`${path}/schedule`, (schedule) => (schedule['matches'] as Json[]).every((m) => m['result'] !== null));
  await api.until(`${path}/standings`, (standings) => standings['revision'] === resolved['resultsRevision']);
  await api.ok(await api.send('post', `${path}/finalisation`,
    { reviewedRevision: resolved['resultsRevision'], expectedRevision: resolved['revision'] }, randomUUID(), 'finalise'));
  await api.until(`${path}/standings`, (view) => view['final'] !== null);
  const standings = await api.read(`${path}/standings`, 'final-standings');
  const rows = (standings['rows'] as Json[]).map((row) => [(row['entrant'] as Json)['name'] as string, row['points'] as number] as const);
  return { tournament, rows };
};
