import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeraldHostAdminService, LineupDetails, MatchView, PlayerDetails, TournamentDetails } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { of, throwError } from 'rxjs';
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
      { provide: AccessState, useValue: { problem: signal(null) } },
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
    await vi.waitFor(() => expect(texts('.operation h2')).toEqual(['River Falcons · lineup', 'North Stars · lineup', 'Start']));
    expect(texts('.operation .summary-title herald-status-label')).toEqual(['0 of 5 selected', '0 of 5 selected']);
    expect(button('Start match')!.disabled).toBe(true);
    expect(text('#start-why')).toBe('River Falcons has no lineup.');
    expect(await violations(page())).toEqual([]);
  });

  it('counts a selection against the required five and saves it as a lineup', async () => {
    const recordLineup = vi.fn(() => of(teamMatch({ revision: 2, first: { ...teamMatch().first, lineups: [lineup(1, falcons.slice(0, 5))] }, blockers: ['second-lineup-missing'] })));
    const { buttons, check, texts, text, toasts, settle } = await open({ getMatch: () => of(teamMatch()), recordLineup });
    await vi.waitFor(() => expect(texts('.operation h2').length).toBe(3));

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
      expect(text('.operation .help')).toBe('Locked at match start · lineup revision 1');
      expect(texts('.operation ul.players')[0]).toContain('Falcon 5');
      expect(page().textContent).toContain('Reserves: Falcon 6, Falcon 7');
      expect(button('Start match')).toBeUndefined();
    });

  it('says when the frozen rosters have not arrived yet', async () => {
    const { page, text } = await open({ getMatch: () => of(teamMatch({ first: { ...teamMatch().first, roster: null }, blockers: ['first-lineup-roster-unknown', 'second-lineup-missing'] })) });
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

  it('reports a rejected lineup in words', async () => {
    const recordLineup = vi.fn(() => throwError(() => problem(400, { errors: { players: ['not-on-roster'] } })));
    const { buttons, check, text, settle } = await open({ getMatch: () => of(teamMatch()), recordLineup });
    await vi.waitFor(() => expect(buttons('Save lineup').length).toBe(2));
    [0, 1, 2, 3, 4].forEach(check);
    await settle();

    buttons('Save lineup')[0].click();
    await settle();

    expect(text('herald-notice')).toContain('A player is not on the team’s frozen roster. Nothing changed.');
  });

  it('says when the match cannot be loaded', async () => {
    const { page, text, button } = await open({ getMatch: () => throwError(() => problem(404)) });
    await vi.waitFor(() => expect(text('herald-notice')).toContain('The match could not be loaded'));
    expect(button('Try again')).toBeTruthy();
    expect(await violations(page())).toEqual([]);
  });
});
