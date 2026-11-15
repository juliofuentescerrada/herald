import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeraldHostAdminService, MatchSummary, ScheduleDetails, StandingsRow, StandingsView, TournamentDetails } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { Observable, of, throwError } from 'rxjs';
import { AccessState, AppContext, QUERY_CLIENT, Session } from '../../platform';
import { StandingsPage } from './standings-page';

const organisation = '0198f000-0000-7000-8000-00000000000a';
const tournamentId = '0198f000-0000-7000-8000-0000000000f1';

const tournament = (over: Partial<TournamentDetails> = {}): TournamentDetails => ({
  id: tournamentId,
  revision: 6,
  publication: 'published',
  registration: 'closed',
  competition: 'running',
  profile: 'singleRoundRobin-3-1-0',
  configuration: { title: 'Saturday Open', entryKind: 'individual', capacity: 8, timeZone: 'Europe/Madrid' },
  missingForPublication: [],
  missingForRegistration: [],
  registrationChangedAt: null,
  admittedEntries: 4,
  waitingEntries: 0,
  checkedInEntries: 0,
  schedulePublished: true,
  start: { conditions: [], eligible: 4, pending: 0, rostersOutsideBounds: null, sharedMemberNames: [], publishedScheduleRevision: 2, startedAt: '2026-11-21T09:05:00Z', startedOnScheduleRevision: 2 },
  ...over,
});

const entrant = (name: string) => ({ entryId: `e-${name.replaceAll(' ', '-')}`, name });
const [robin, sam, jamie, taylor] = ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch'].map(entrant);

const row = (position: number, shared: boolean, who: { entryId: string; name: string }, numbers: [number, number, number, number, number], lines: StandingsRow['lines'] = []): StandingsRow => {
  const [resolved, won, drawn, lost, points] = numbers;
  return { position, shared, entrant: who, resolved, won, drawn, lost, points, lines };
};

const provisional: StandingsView = {
  tournamentId,
  revision: 5,
  resolvedMatches: 4,
  matches: 6,
  rows: [
    row(1, false, robin, [2, 2, 0, 0, 6]),
    row(2, true, jamie, [2, 1, 1, 0, 4]),
    row(2, true, sam, [3, 1, 1, 1, 4], [
      { round: 1, opponent: robin, result: 'lost', cause: 'played', points: 0 },
      { round: 2, opponent: taylor, result: 'won', cause: 'played', points: 3 },
      { round: 3, opponent: jamie, result: 'drawn', cause: 'played', points: 1 },
    ]),
    row(4, false, taylor, [1, 0, 0, 1, 0]),
  ],
};

const empty: StandingsView = { tournamentId, revision: 1, resolvedMatches: 0, matches: 6, rows: [robin, jamie, sam, taylor].map((who) => row(1, true, who, [0, 0, 0, 0, 0])) };

const resolvedMatches = (count: number): ScheduleDetails =>
  ({ matches: Array.from({ length: 6 }, (_, index) => ({ state: index < count ? 'resolved' : 'scheduled' }) as MatchSummary) }) as ScheduleDetails;

async function open(standings: () => Observable<StandingsView>, details: TournamentDetails = tournament(), schedule = resolvedMatches(4)) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/tournaments/:tournamentId/standings', component: StandingsPage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null) } },
      { provide: HeraldHostAdminService, useValue: { getTournament: () => of(details), getSchedule: () => of(schedule), getStandings: standings } },
    ],
  });
  const harness = await RouterTestingHarness.create(`/organisations/${organisation}/tournaments/${tournamentId}/standings`);
  document.body.appendChild(harness.fixture.nativeElement);
  const page = () => harness.routeNativeElement as HTMLElement;
  const settle = async () => {
    await vi.waitFor(() => expect(page().querySelector('[role="status"]')?.textContent ?? '').not.toContain('Loading'));
    await harness.fixture.whenStable();
  };
  await settle();
  return {
    page,
    settle,
    text: (selector: string) => page().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(),
    texts: (selector: string) => [...page().querySelectorAll(selector)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()),
    button: (text: string) => [...page().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!,
  };
}

const violations = async (page: HTMLElement) => (await axe.run(page, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

describe('The standings page', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('says standings begin at start before the competition starts', async () => {
    const { page, text } = await open(() => of(provisional), tournament({ competition: 'preparation' }));

    expect(text('herald-notice')).toContain('Standings begin when the competition starts');
    expect(page().querySelector('table')).toBeNull();
    expect(await violations(page())).toEqual([]);
  });

  it('ranks every entrant at 1= with no points before any result', async () => {
    const { page, text, texts } = await open(() => of(empty), tournament(), resolvedMatches(0));

    expect(texts('tbody tr td:first-child [aria-hidden="true"]')).toEqual(['1=', '1=', '1=', '1=']);
    expect(text('.summary')).toContain('Provisional · 0 of 6 matches resolved');
    expect(text('.summary')).toContain('No match resolved yet');
    expect(await violations(page())).toEqual([]);
  });

  it('shows the provisional table with its resolved count and results revision',
    { meta: { type: 'covers', description: 'standings: A shared position' } }, async () => {
      const { page, text, texts } = await open(() => of(provisional));

      expect(text('.title')).toContain('Provisional');
      expect(text('.summary')).toContain('Provisional · 4 of 6 matches resolved');
      expect(text('.summary')).toContain('Results revision 5');
      expect(texts('thead th')).toEqual(['Position', 'Player', 'Resolved', 'Won', 'Drawn', 'Lost', 'Points']);
      expect(texts('tbody td:first-child .visually-hidden')).toEqual(['Position 1', 'Position 2, shared', 'Position 2, shared', 'Position 4']);
      expect(texts('tbody td:first-child [aria-hidden="true"]')).toEqual(['1', '2=', '2=', '4']);
      expect(texts('nav[aria-label="Tournament sections"] a')).toEqual(['Configuration', 'Entries', 'Schedule', 'Standings']);
      expect(page().querySelector('nav a[aria-current="page"]')?.textContent?.trim()).toBe('Standings');
      expect(await violations(page())).toEqual([]);
    });

  it('reads four of six matches resolved with the results revision', { meta: { type: 'covers', description: 'standings: Partway through' } }, async () => {
    const { text } = await open(() => of(provisional));

    expect(text('.summary p')).toBe('Provisional · 4 of 6 matches resolved');
    expect(text('.summary .help')).toContain('Results revision 5');
  });

  it('opens an entrant’s explanation, whose points add up to its total', async () => {
    const { page, settle, button, texts } = await open(() => of(provisional));

    button('Sam Reed').click();
    await settle();

    expect(button('Sam Reed').getAttribute('aria-expanded')).toBe('true');
    expect(texts('.explain li')).toEqual([
      'Round 1 · vs Robin Vale · lost · played · 0 points',
      'Round 2 · vs Taylor Finch · won · played · 3 points',
      'Round 3 · vs Jamie Brook · draw · played · 1 point',
    ]);
    expect(texts('.explain .help')).toEqual(['Resolved 3 · won 1 · drawn 1 · lost 1', 'Total: 4 points']);
    expect(await violations(page())).toEqual([]);
  });

  it('names a rest round with no points and a double absence as no winner', { meta: { type: 'covers', description: 'standings: Five players' } }, async () => {
    const view: StandingsView = {
      ...provisional,
      rows: [row(1, false, robin, [1, 0, 0, 0, 0], [
        { round: 1, opponent: sam, result: 'noWinner', cause: 'doubleAbsence', points: 0 },
        { round: 2, opponent: null, result: null, cause: null, points: 0 },
      ])],
    };
    const { settle, button, texts } = await open(() => of(view));

    button('Robin Vale').click();
    await settle();

    expect(texts('.explain li')).toEqual(['Round 1 · vs Sam Reed · no winner · double absence · 0 points', 'Round 2 · Rest · no points']);
  });

  it('heads the entrant column Team in a team tournament', async () => {
    const { texts } = await open(() => of(provisional), tournament({ configuration: { title: 'Club League', entryKind: 'team', capacity: 8, timeZone: 'Europe/Madrid' } }));

    expect(texts('thead th')[1]).toBe('Team');
  });

  it('shows Updating while Competition knows more results than the standings', async () => {
    const { page, text } = await open(() => of(provisional), tournament(), resolvedMatches(5));

    expect(text('.title')).toContain('Updating');
    expect(text('.title')).not.toContain('Provisional');
    expect(page().querySelector('table')).not.toBeNull();
    expect(await violations(page())).toEqual([]);
  });

  it('offers to try again when the standings cannot be loaded', async () => {
    let calls = 0;
    const { page, settle, button, text } = await open(() => (calls++ === 0 ? throwError(() => new HttpErrorResponse({ status: 500 })) : of(provisional)));

    expect(text('herald-notice')).toContain('The standings could not be loaded');
    expect(await violations(page())).toEqual([]);
    button('Try again').click();
    await vi.waitFor(() => expect(page().querySelector('table')).not.toBeNull());
    await settle();
  });
});
