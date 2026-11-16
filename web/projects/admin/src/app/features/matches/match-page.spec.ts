import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeraldHostAdminService, LineupDetails, MatchView, PlayerDetails, TournamentDetails } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { of, Subject, throwError } from 'rxjs';
import { AccessState, AppContext, QUERY_CLIENT, Session } from '../../platform';
import { MatchPage } from './match-page';

const organisation = '0198f000-0000-7000-8000-00000000000a';
const tournamentId = '0198f000-0000-7000-8000-0000000000f1';
const matchId = '0198f000-0000-7000-8000-0000000000m1';

const tournament: TournamentDetails = {
  id: tournamentId,
  revision: 5,
  publication: 'published',
  registration: 'closed',
  competition: 'running',
  profile: 'singleRoundRobin-3-1-0',
  configuration: { title: 'Saturday Team League', entryKind: 'team', capacity: 8, timeZone: 'Europe/Madrid' },
  missingForPublication: [],
  missingForRegistration: [],
  registrationChangedAt: null,
  admittedEntries: 2,
  waitingEntries: 0,
  checkedInEntries: 0,
  schedulePublished: true,
  start: { conditions: [], eligible: 2, pending: 0, rostersOutsideBounds: [], sharedMemberNames: [], publishedScheduleRevision: 1, startedAt: '2026-11-22T09:05:00Z', startedOnScheduleRevision: 1 },
} as TournamentDetails;

const players = (team: string): PlayerDetails[] => Array.from({ length: 7 }, (_, index) => ({ playerId: `${team}-${index + 1}`, name: `${team} ${index + 1}` }));
const falcons = players('Falcon');
const stars = players('Star');
const lineup = (number: number, chosen: PlayerDetails[]): LineupDetails => ({ number, players: chosen, recordedAt: '2026-11-22T09:12:00Z' });

const teamMatch = (over: Partial<MatchView> = {}): MatchView => ({
  matchId,
  revision: 1,
  round: 1,
  state: 'scheduled',
  activePlayers: 5,
  first: { entrant: { entryId: 'e-falcons', name: 'River Falcons' }, roster: falcons, lineups: [] },
  second: { entrant: { entryId: 'e-stars', name: 'North Stars' }, roster: stars, lineups: [] },
  start: null,
  blockers: ['first-lineup-missing', 'second-lineup-missing'],
  result: null,
  replacedResults: [],
  appearances: [],
  unavailable: [],
  ...over,
});

const individual = (over: Partial<MatchView> = {}): MatchView => ({
  matchId,
  revision: 1,
  round: 1,
  state: 'scheduled',
  activePlayers: null,
  first: { entrant: { entryId: 'e-sam', name: 'Sam Reed' }, roster: null, lineups: [] },
  second: { entrant: { entryId: 'e-jamie', name: 'Jamie Brook' }, roster: null, lineups: [] },
  start: null,
  blockers: [],
  result: null,
  replacedResults: [],
  appearances: [],
  unavailable: [],
  ...over,
});

const problem = (status: number, body: object = {}) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });

async function open(api: Record<string, unknown>) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/tournaments/:tournamentId/matches/:matchId', component: MatchPage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null), keepDraft: vi.fn() } },
      { provide: HeraldHostAdminService, useValue: { getTournament: () => of(tournament), ...api } },
    ],
  });
  const harness = await RouterTestingHarness.create(`/organisations/${organisation}/tournaments/${tournamentId}/matches/${matchId}`);
  document.body.appendChild(harness.fixture.nativeElement);
  const all = () => document.body;
  return {
    page: () => harness.routeNativeElement as HTMLElement,
    settle: () => harness.fixture.whenStable(),
    button: (text: string) => [...all().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text),
    buttons: (text: string) => [...all().querySelectorAll<HTMLButtonElement>('button')].filter((b) => b.textContent?.trim() === text),
    text: (selector: string) => all().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(),
    texts: (selector: string) => [...all().querySelectorAll(selector)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()),
    toasts: () => TestBed.inject(Toasts).toasts().map((toast) => toast.text),
    check: (index: number) => {
      const box = all().querySelectorAll<HTMLInputElement>('input[type=checkbox]')[index];
      box.click();
    },
  };
}

const violations = async (page: HTMLElement) =>
  (await axe.run(page, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

/** Clicks the radio at that position of a named group, then lets the page render the next fields. */
const choose = async (page: () => HTMLElement, settle: () => Promise<unknown>, name: string, index: number) => {
  page().querySelectorAll<HTMLInputElement>(`input[name=${name}]`)[index].click();
  await settle();
};

const resolvedAs = (result: Partial<NonNullable<MatchView['result']>>, over: Partial<MatchView> = {}) =>
  individual({ revision: 2, state: 'resolved', result: { outcome: 'none', cause: 'played', played: false, reason: null, recordedAt: '2026-11-22T09:40:00Z', ...result }, ...over });

describe('The match page', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.querySelectorAll('herald-dialog').forEach((element) => element.remove());
  });

  it('starts an individual match without lineups or confirmation', async () => {
    const startMatch = vi.fn(() => of(individual({ revision: 2, state: 'inPlay', start: { startedAt: '2026-11-22T09:20:00Z', firstLineup: null, secondLineup: null } })));
    const { page, button, text, toasts, settle } = await open({ getMatch: () => of(individual()), startMatch });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('Round 1 · Sam Reed vs Jamie Brook'));
    expect(page().querySelector('input[type=checkbox]')).toBeNull();
    expect(await violations(page())).toEqual([]);

    button('Start match')!.click();
    await settle();

    expect(startMatch).toHaveBeenCalledWith(organisation, tournamentId, matchId, { expectedRevision: 1 });
    await vi.waitFor(() => expect(text('.summary-title herald-status-label')).toBe('In play'));
    expect(toasts()).toEqual(['Match started.']);
  });

  it('shows both empty lineups and names what blocks the start', async () => {
    const { page, button, texts, text } = await open({ getMatch: () => of(teamMatch()) });
    await vi.waitFor(() => expect(texts('.operation h2')).toEqual(['River Falcons · lineup', 'North Stars · lineup', 'Start', 'Result']));
    expect(texts('.operation .summary-title herald-status-label')).toEqual(['0 of 5 selected', '0 of 5 selected']);
    expect(button('Start match')!.disabled).toBe(true);
    expect(text('#start-why')).toBe('River Falcons has no lineup.');
    expect(await violations(page())).toEqual([]);
  });

  it('counts a selection against the required five and saves it as a lineup', async () => {
    const recordLineup = vi.fn(() => of(teamMatch({ revision: 2, first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] }, blockers: ['second-lineup-missing'] })));
    const { buttons, check, texts, text, toasts, settle } = await open({ getMatch: () => of(teamMatch()), recordLineup });
    await vi.waitFor(() => expect(texts('.operation h2').length).toBe(4));

    [0, 1, 2, 3].forEach(check);
    await settle();
    expect(texts('.operation .summary-title herald-status-label')[0]).toBe('4 of 5 selected');
    expect(buttons('Save lineup')[0].disabled).toBe(true);
    expect(text('#first-save-why')).toBe('Choose exactly 5 players.');

    check(4);
    await settle();
    buttons('Save lineup')[0].click();
    await settle();

    expect(recordLineup).toHaveBeenCalledWith(organisation, tournamentId, matchId, 'first', { expectedRevision: 1, players: falcons.slice(0, 5).map((p) => p.playerId) });
    expect(toasts()).toEqual(['River Falcons’ lineup saved.']);
    await vi.waitFor(() => expect(text('#start-why')).toBe('North Stars has no lineup.'));
  });

  it('asks before starting a team match and then shows both lineups locked',
    { meta: { type: 'covers', description: 'match-lineups: Starting from the Match page' } }, async () => {
      const ready = teamMatch({
        revision: 3,
        first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] },
        second: { ...teamMatch().second, lineups: [lineup(1, stars.slice(0, 5))] },
        blockers: [],
      });
      const started = { ...ready, revision: 4, state: 'inPlay' as const, start: { startedAt: '2026-11-22T09:20:00Z', firstLineup: 1, secondLineup: 1 } };
      const startMatch = vi.fn(() => of(started));
      const { page, button, buttons, text, texts, settle } = await open({ getMatch: () => of(ready), startMatch });
      await vi.waitFor(() => expect(button('Start match')!.disabled).toBe(false));

      button('Start match')!.click();
      await settle();
      expect(text('herald-dialog p')).toContain('Starting locks both lineups');
      expect(await violations(document.body)).toEqual([]);
      buttons('Start match').at(-1)!.click();
      await settle();

      expect(startMatch).toHaveBeenCalledOnce();
      await vi.waitFor(() => expect(text('.summary-title herald-status-label')).toBe('In play'));
      expect(texts('.operation .summary-title herald-status-label')).toEqual(['Locked', 'Locked']);
      expect(text('.operation details > .help')).toBe('Locked at match start · lineup revision 1');
      expect(texts('.operation ul.players')[0]).toContain('Falcon 5');
      expect(page().textContent).toContain('Reserves: Falcon 6, Falcon 7');
      expect(button('Start match')).toBeUndefined();
    });

  it('says when the frozen rosters have not arrived yet',
    { meta: { type: 'covers', description: 'match-lineups: Rosters not yet reported' } }, async () => {
    const { page, text } = await open({ getMatch: () => of(teamMatch({ first: { ...teamMatch().first, roster: null }, blockers: ['first-lineup-unknown', 'second-lineup-missing'] })) });
    await vi.waitFor(() => expect(text('herald-notice')).toContain('Waiting for the frozen rosters'));
    expect(page().querySelector('input[type=checkbox]')).toBeNull();
  });

  it('offers to reload when another tab changed the match, and keeps nothing half-saved', async () => {
    const recordLineup = vi.fn(() => throwError(() => problem(409, { type: 'match-revision-conflict' })));
    const getMatch = vi.fn(() => of(teamMatch()));
    const { button, buttons, check, text, settle } = await open({ getMatch, recordLineup });
    await vi.waitFor(() => expect(buttons('Save lineup').length).toBe(2));
    [0, 1, 2, 3, 4].forEach(check);
    await settle();

    buttons('Save lineup')[0].click();
    await settle();

    expect(text('herald-notice')).toContain('This match changed elsewhere');
    expect(button('Start match')!.disabled).toBe(true);
    button('Reload latest')!.click();
    await settle();
    expect(getMatch).toHaveBeenCalledTimes(2);
  });

  it('names a player who is not on the frozen roster', async () => {
    const recordLineup = vi.fn(() => throwError(() => problem(400, { errors: { [`player-${stars[0].playerId}`]: ['not-on-roster'] } })));
    const { buttons, check, text, settle } = await open({ getMatch: () => of(teamMatch()), recordLineup });
    await vi.waitFor(() => expect(buttons('Save lineup').length).toBe(2));
    [0, 1, 2, 3, 4].forEach(check);
    await settle();

    buttons('Save lineup')[0].click();
    await settle();

    expect(text('herald-notice')).toContain('Star 1 is not on that team’s frozen roster. Nothing changed.');
  });

  it('names a sanctioned starter that blocks the start and offers the player out of the lineup only',
    { meta: { type: 'covers', description: 'match-lineups: A sanctioned starter' } }, async () => {
      const blocked = teamMatch({
        first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] },
        second: { ...teamMatch().second, lineups: [lineup(1, stars.slice(0, 5))] },
        blockers: ['first-lineup-unavailable'],
        unavailable: [falcons[0], falcons[6]],
      });
      const { page, button, text, texts } = await open({ getMatch: () => of(blocked) });
      await vi.waitFor(() => expect(text('#start-why')).toBe('River Falcons’ lineup includes Falcon 1, who is unavailable. Revise the lineup from the other eligible players.'));

      expect(button('Start match')?.disabled).toBe(true);
      const boxes = page().querySelectorAll<HTMLInputElement>('input[type=checkbox]');
      // Falcon 1 is chosen and can be taken out; Falcon 7 is not chosen and cannot be put in.
      expect([boxes[0].disabled, boxes[6].disabled]).toEqual([false, true]);
      expect(texts('.choice herald-status-label').slice(0, 2)).toEqual(['Unavailable', 'Unavailable']);
      expect(await violations(page())).toEqual([]);
    });

  it('says a team with too few eligible players waits for the owner’s outcome', async () => {
    const short = teamMatch({ blockers: ['first-roster-too-few-eligible', 'first-lineup-missing', 'second-lineup-missing'], unavailable: falcons.slice(4, 7) });
    const { page, text } = await open({ getMatch: () => of(short) });
    await vi.waitFor(() => expect(text('#start-why')).toBe('River Falcons has fewer than 5 eligible players. Record an outcome when you decide; the team is not withdrawn automatically.'));
    expect(text('.operation herald-notice')).toContain('Too few eligible players');
    expect(await violations(page())).toEqual([]);
  });

  it('says when the match cannot be loaded', async () => {
    const { page, text, button } = await open({ getMatch: () => throwError(() => problem(404)) });
    await vi.waitFor(() => expect(text('herald-notice')).toContain('The match could not be loaded'));
    expect(button('Try again')).toBeTruthy();
    expect(await violations(page())).toEqual([]);
  });

  it('chooses no outcome until the owner does',
    { meta: { type: 'covers', description: 'match-results: No preselected winner' } }, async () => {
      const { page, button, text, settle } = await open({ getMatch: () => of(individual()) });
      await vi.waitFor(() => expect(text('#result-heading')).toBe('Result'));
      expect([...page().querySelectorAll<HTMLInputElement>('input[name=cause]')].map((radio) => radio.checked)).toEqual([false, false, false, false]);
      expect(text('#record-why')).toBe('Choose what happened first.');
      await choose(page, settle, 'cause', 0);
      await vi.waitFor(() => expect(page().querySelectorAll('input[name=outcome]').length).toBe(3));
      expect([...page().querySelectorAll<HTMLInputElement>('input[name=outcome]')].map((radio) => radio.checked)).toEqual([false, false, false]);
      expect(button('Record result')!.disabled).toBe(true);
      expect(text('#record-why')).toBe('Choose the outcome first.');
      expect(page().textContent).toContain('This match has not started: recording a played result also starts it.');
      expect(await violations(page())).toEqual([]);
    });

  it('records a win and shows it in words, and a retry reuses the same operation', async () => {
    const resolved = individual({ revision: 2, state: 'resolved', start: { startedAt: '2026-11-22T09:40:00Z', firstLineup: null, secondLineup: null }, result: { outcome: 'first', cause: 'played', played: true, reason: null, recordedAt: '2026-11-22T09:40:00Z' } });
    let calls = 0;
    const recordResult = vi.fn(() => (++calls === 1 ? throwError(() => problem(0)) : of(resolved)));
    const { page, button, text, texts, toasts, settle } = await open({ getMatch: () => of(individual()), recordResult });
    await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
    await choose(page, settle, 'cause', 0);
    await choose(page, settle, 'outcome', 0);

    button('Record result')!.click();
    await settle();
    await vi.waitFor(() => expect(text('herald-notice')).toContain('The request failed'));
    button('Record result')!.click();
    await settle();

    const bodies = recordResult.mock.calls.map((call) => (call as unknown[])[3] as { operationId: string; outcome: string });
    expect(bodies[0].operationId).toBe(bodies[1].operationId);
    expect(bodies[1].outcome).toBe('first');
    await vi.waitFor(() => expect(texts('.operation .summary-title herald-status-label')).toContain('Resolved'));
    expect(page().textContent).toContain('Sam Reed won · played');
    expect(page().textContent).toContain('This result is read-only.');
    expect(button('Start match')).toBeUndefined();
    expect(toasts()).toEqual(['Result recorded.']);
  });

  it('asks for the start before a played team result', async () => {
    const { page, text, button, settle } = await open({ getMatch: () => of(teamMatch()) });
    await vi.waitFor(() => expect(text('#result-heading')).toBe('Result'));
    await choose(page, settle, 'cause', 0);
    expect(page().textContent).toContain('A played team result needs both lineups locked');
    expect(button('Record result')).toBeUndefined();
  });

  it('shows a drawn team result with the lineups still locked', async () => {
    const ready = teamMatch({
      revision: 5,
      state: 'resolved',
      first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] },
      second: { ...teamMatch().second, lineups: [lineup(1, stars.slice(0, 5))] },
      blockers: [],
      start: { startedAt: '2026-11-22T09:20:00Z', firstLineup: 1, secondLineup: 1 },
      result: { outcome: 'draw', cause: 'played', played: true, reason: null, recordedAt: '2026-11-22T10:40:00Z' },
      appearances: [...falcons.slice(0, 5), ...stars.slice(0, 5)],
    });
    const { page, texts } = await open({ getMatch: () => of(ready) });
    await vi.waitFor(() => expect(page().textContent).toContain('Draw · played'));
    expect(texts('.summary-title herald-status-label')[0]).toBe('Resolved');
    expect(texts('.operation .summary-title herald-status-label').slice(1, 3)).toEqual(['Locked', 'Locked']);
    expect(await violations(page())).toEqual([]);
  });

  it('reports a result recorded elsewhere', async () => {
    const recordResult = vi.fn(() => throwError(() => problem(400, { errors: { match: ['resolved'] } })));
    const { page, button, text, settle } = await open({ getMatch: () => of(individual()), recordResult });
    await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
    await choose(page, settle, 'cause', 0);
    await choose(page, settle, 'outcome', 0);
    button('Record result')!.click();
    await settle();
    await vi.waitFor(() => expect(text('herald-notice')).toContain('This match already has a result. This result is read-only. Nothing changed.'));
  });

  it('shows the result as saving and blocks a repeat while it is recorded', async () => {
    const recordResult = vi.fn(() => new Subject<MatchView>());
    const { page, button, text, settle } = await open({ getMatch: () => of(individual()), recordResult });
    await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
    await choose(page, settle, 'cause', 0);
    await choose(page, settle, 'outcome', 0);

    button('Record result')!.click();
    await settle();
    button('Record result')!.click();
    await settle();

    expect(recordResult).toHaveBeenCalledOnce();
    expect(page().querySelector<HTMLFieldSetElement>('fieldset.outcomes')!.disabled).toBe(true);
    expect(text('#record-why')).toBe('Request in progress. Please wait; do not submit again.');
    expect(page().querySelector('[aria-labelledby=result-heading]')!.getAttribute('aria-busy')).toBe('true');
    expect(await violations(page())).toEqual([]);
  });

  it('offers the outcome of a team match in play', async () => {
    const inPlay = teamMatch({
      revision: 4,
      state: 'inPlay',
      first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] },
      second: { ...teamMatch().second, lineups: [lineup(1, stars.slice(0, 5))] },
      blockers: [],
      start: { startedAt: '2026-11-22T09:20:00Z', firstLineup: 1, secondLineup: 1 },
    });
    const { page, texts, button, settle } = await open({ getMatch: () => of(inPlay) });
    await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
    expect(texts('fieldset.options label')).toEqual(['Played', 'Concession', 'No contest']);
    await choose(page, settle, 'cause', 0);
    await vi.waitFor(() => expect(texts('fieldset.outcomes label')).toEqual(['River Falcons wins', 'Draw', 'North Stars wins']));
    expect(page().textContent).not.toContain('recording a played result also starts it');
    expect(button('Start match')).toBeUndefined();
    expect(await violations(page())).toEqual([]);
  });

  it('offers to reload when another tab changed the match before the result', async () => {
    const recordResult = vi.fn(() => throwError(() => problem(409, { type: 'match-revision-conflict' })));
    const { page, button, text, settle } = await open({ getMatch: () => of(individual()), recordResult });
    await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
    await choose(page, settle, 'cause', 0);
    await choose(page, settle, 'outcome', 0);

    button('Record result')!.click();
    await settle();

    await vi.waitFor(() => expect(text('herald-notice')).toContain('This match changed elsewhere'));
    expect(button('Record result')!.disabled).toBe(true);
    expect(page().querySelector<HTMLInputElement>('input[name=outcome]')!.checked).toBe(true);
    expect(await violations(page())).toEqual([]);
  });

  it('offers no start or lineup change on a team match resolved without a start', async () => {
    const conceded = teamMatch({
      revision: 4,
      state: 'resolved',
      first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] },
      blockers: [],
      result: { outcome: 'second', cause: 'concession', played: false, reason: null, recordedAt: '2026-11-22T09:40:00Z' },
    });
    const { page, button } = await open({ getMatch: () => of(conceded) });
    await vi.waitFor(() => expect(page().textContent).toContain('River Falcons conceded before play · North Stars wins · no play recorded'));
    expect(button('Start match')).toBeUndefined();
    expect(button('Save lineup')).toBeUndefined();
    expect(page().querySelector('input[type=checkbox]')).toBeNull();
    expect(page().textContent).toContain('Resolved without a start: no lineup was locked.');
    expect(await violations(page())).toEqual([]);
  });

  describe('records an exceptional outcome', () => {
    it('sends a concession before play with only its fields', async () => {
      const recordResult = vi.fn(() => of(resolvedAs({ cause: 'concession', outcome: 'first' })));
      const { page, button, text, texts, settle } = await open({ getMatch: () => of(individual()), recordResult });
      await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
      await choose(page, settle, 'cause', 1);

      expect(texts('fieldset.options legend')).toEqual(['What happened?', 'Who conceded?', 'Did play take place?']);
      expect(page().querySelector('input[name=outcome]')).toBeNull();
      expect(text('#record-why')).toBe('Choose who conceded.');
      await choose(page, settle, 'conceding', 1);
      expect(text('#record-why')).toBe('Choose whether play took place.');
      expect(await violations(page())).toEqual([]);
      await choose(page, settle, 'play', 1);
      expect(button('Record result')!.disabled).toBe(false);
      button('Record result')!.click();
      await settle();

      expect((recordResult.mock.calls[0] as unknown[])[3]).toEqual(expect.objectContaining({ cause: 'concession', entrant: 'second', played: false, expectedRevision: 1 }));
    });

    it('sends both absent as a double absence, and offers no absence once the match has started', async () => {
      const recordResult = vi.fn(() => of(resolvedAs({ cause: 'doubleAbsence' })));
      const { page, button, texts, settle } = await open({ getMatch: () => of(individual()), recordResult });
      await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
      await choose(page, settle, 'cause', 2);

      expect(texts('fieldset.options:nth-of-type(2) label')).toEqual(['Sam Reed', 'Jamie Brook', 'Both were absent']);
      expect(page().querySelector('input[name=play]')).toBeNull();
      expect(await violations(page())).toEqual([]);
      await choose(page, settle, 'absent', 2);
      button('Record result')!.click();
      await settle();

      const body = (recordResult.mock.calls[0] as unknown[])[3] as Record<string, unknown>;
      expect(body).toEqual(expect.objectContaining({ cause: 'doubleAbsence' }));
      expect(body).not.toHaveProperty('entrant');
    });

    it('asks a no contest for its reason before it can be recorded', async () => {
      const recordResult = vi.fn(() => of(resolvedAs({ cause: 'noContest', reason: 'Venue closed' })));
      const { page, button, text, settle } = await open({ getMatch: () => of(individual()), recordResult });
      await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
      await choose(page, settle, 'cause', 3);
      await choose(page, settle, 'play', 1);

      expect(button('Record result')!.disabled).toBe(true);
      expect(text('#record-why')).toBe('A no contest needs a reason.');
      expect(text('#reason-help')).toBe('Private to the organisation. At most 500 characters.');
      expect(page().querySelector('textarea')!.maxLength).toBe(500);
      expect(await violations(page())).toEqual([]);
      const reason = page().querySelector('textarea')!;
      reason.value = 'Venue closed';
      reason.dispatchEvent(new Event('input'));
      await settle();
      button('Record result')!.click();
      await settle();

      expect((recordResult.mock.calls[0] as unknown[])[3]).toEqual(expect.objectContaining({ cause: 'noContest', played: false, reason: 'Venue closed' }));
    });

    it('refuses play on a team match that has not started', async () => {
      const { page, button, text, settle } = await open({ getMatch: () => of(teamMatch()) });
      await vi.waitFor(() => expect(button('Record result')).toBeTruthy());
      await choose(page, settle, 'cause', 1);
      await choose(page, settle, 'conceding', 0);
      await choose(page, settle, 'play', 0);

      expect(text('.operation herald-notice')).toContain('An administrative outcome cannot record play on a team match that has not started.');
      expect(button('Record result')!.disabled).toBe(true);
      expect(text('#record-why')).toBe('Start the match first, or choose “No”.');
      expect(await violations(page())).toEqual([]);
    });

    it.each([
      [{ cause: 'concession', outcome: 'second' }, 'Sam Reed conceded before play · Jamie Brook wins · no play recorded'],
      [{ cause: 'doubleAbsence' }, 'Both were absent · 0 each · no play recorded'],
      [{ cause: 'noContest', played: true, reason: 'Venue closed' }, 'No contest: Venue closed · 0 each · play recorded'],
    ] as const)('states a resolved %o in words with no score', async (result, words) => {
      const { page, button } = await open({ getMatch: () => of(resolvedAs(result)) });
      await vi.waitFor(() => expect(page().textContent).toContain(words));
      expect(page().textContent).not.toContain('· played');
      expect(button('Record result')).toBeUndefined();
      expect(button('Start match')).toBeUndefined();
      expect(await violations(page())).toEqual([]);
    });
  });

  it('registers only unsaved lineup changes for deliberate exit and clears them when restored', async () => {
    const view = await open({ getMatch: () => of(teamMatch()) });
    await vi.waitFor(() => expect(view.page().querySelector('input[type=checkbox]')).not.toBeNull());
    const readDraft = vi.mocked(TestBed.inject(AccessState).keepDraft).mock.calls[0][0];
    expect(readDraft()).toBe('');
    view.check(0);
    await view.settle();
    expect(readDraft()).toContain('Falcon 1');
    const exit = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(exit);
    expect(exit.defaultPrevented).toBe(true);
    view.check(0);
    await view.settle();
    expect(readDraft()).toBe('');
  });

  it('reloads the tournament as well as the match after a failed required dependency', async () => {
    let reads = 0;
    const view = await open({ getTournament: () => ++reads === 1 ? throwError(() => problem(503)) : of(tournament), getMatch: () => of(individual()) });
    await vi.waitFor(() => expect(view.button('Try again')).toBeDefined());
    view.button('Try again')!.click();
    await vi.waitFor(() => expect(view.page().textContent).toContain('Sam Reed vs Jamie Brook'));
    expect(reads).toBe(2);
  });
});
