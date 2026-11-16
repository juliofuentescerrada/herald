import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeraldHostAdminService, MatchSummary, ScheduleDetails, StandingsEntrant, StandingsRow, StandingsView, TournamentDetails } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { Toasts } from '@herald/ui';
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
  archived: false,
  cancellation: null,
  ...over,
});

const entrant = (name: string): StandingsEntrant => ({ entryId: `e-${name.replaceAll(' ', '-')}`, name, status: 'active' });
const [robin, sam, jamie, taylor] = ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch'].map(entrant);

const row = (position: number, shared: boolean, who: StandingsEntrant, numbers: [number, number, number, number, number], lines: StandingsRow['lines'] = []): StandingsRow => {
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
  final: null,
  finals: [],
  noChampion: false,
};

const empty: StandingsView = { tournamentId, revision: 1, resolvedMatches: 0, matches: 6, rows: [robin, jamie, sam, taylor].map((who) => row(1, true, who, [0, 0, 0, 0, 0])), final: null, finals: [], noChampion: false };

const names = [[robin, sam], [jamie, taylor], [robin, jamie], [sam, taylor], [robin, taylor], [sam, jamie]];
const resolvedMatches = (count: number, resultsRevision = count + 1, over: Partial<ScheduleDetails> = {}): ScheduleDetails =>
  ({
    revision: 9,
    resultsRevision,
    finalised: false,
    finals: [],
    matches: names.map(([first, second], index) => ({
      matchId: `m-${index}`,
      round: Math.floor(index / 2) + 1,
      first: { entryId: first.entryId, name: first.name },
      second: { entryId: second.entryId, name: second.name },
      state: index < count ? 'resolved' : index === count ? 'inPlay' : 'scheduled',
      result: null,
    }) as MatchSummary),
    ...over,
  }) as ScheduleDetails;

async function open(standings: () => Observable<StandingsView>, details: TournamentDetails = tournament(), schedule = resolvedMatches(4), api: Record<string, unknown> = {}) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/tournaments/:tournamentId/standings', component: StandingsPage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null) } },
      { provide: HeraldHostAdminService, useValue: { getTournament: () => of(details), getSchedule: () => of(schedule), getStandings: standings, ...api } },
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
    toasts: () => TestBed.inject(Toasts).toasts().map((toast) => toast.text),
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

  it('shows a competition cancelled after start as Cancelled, with no champion and no review', async () => {
    const { page, text } = await open(() => of(provisional), tournament({ competition: 'cancelled' }), resolvedMatches(4));

    expect(text('.title')).toContain('Cancelled');
    expect(text('.title')).not.toContain('Provisional');
    expect(text('.column herald-notice')).toContain('Cancelled · no champion or final ranking');
    expect(page().querySelector('#review-heading')).toBeNull();
    expect(page().querySelector('table')).not.toBeNull();
    expect(await violations(page())).toEqual([]);
  });

  it('shows Updating while Competition knows more results than the standings', async () => {
    const { page, text } = await open(() => of(provisional), tournament(), resolvedMatches(4, 6));

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

  it('flags a withdrawn leader, who keeps its points and position', async () => {
    const view: StandingsView = { ...provisional, rows: [{ ...provisional.rows[0], entrant: { ...robin, status: 'withdrawn' } }, ...provisional.rows.slice(1)] };
    const { page, text } = await open(() => of(view));
    await vi.waitFor(() => expect(text('tbody tr:first-child herald-status-label')).toBe('Withdrawn'));
    expect(text('tbody tr:first-child td:last-child')).toBe('6');
    expect(await violations(page())).toEqual([]);
  });
});

describe('Reviewing and finalising the standings', () => {
  afterEach(() => TestBed.resetTestingModule());

  const resolved: StandingsView = { ...provisional, revision: 7, resolvedMatches: 6 };
  const final = (over: object = {}) => ({
    number: 1, resultsRevision: 7, finalisedAt: '2026-11-29T17:10:00Z', finalisedBy: 'Alex Morgan', reopenReason: null, reopenedAt: null, reopenedBy: null, ...over,
  });
  const finalised = resolvedMatches(6, 7, { finalised: true, finals: [final()] });
  const problem = (status: number, body: object) =>
    new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });
  const dialogButton = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find((b) => b.textContent?.trim() === text)!;

  it('shows the three revisions and Finalise when every match is resolved and the standings are current', async () => {
    const { page, text, button } = await open(() => of(resolved), tournament(), resolvedMatches(6, 7));

    expect(text('#review-heading')).toBe('Review and finalise');
    expect(text('.review')).toContain('All 6 matches are resolved.');
    expect(text('.review .help')).toBe('Results revision 7 · standings revision 7 · you are reviewing revision 7');
    expect(button('Finalise')).toBeTruthy();
    expect(await violations(page())).toEqual([]);
  });

  it('lists the unresolved matches with links and offers no Finalise', async () => {
    const { page, text, texts, button } = await open(() => of(provisional), tournament(), resolvedMatches(4, 5));

    expect(text('.review p')).toBe('2 matches are unresolved. Resolve them before finalising.');
    expect(texts('.unresolved a')).toEqual(['Round 3 · Robin Vale vs Taylor Finch', 'Round 3 · Sam Reed vs Jamie Brook']);
    expect(texts('.unresolved herald-status-label')).toEqual(['In play', 'Scheduled']);
    expect(button('Finalise')).toBeUndefined();
    expect(await violations(page())).toEqual([]);
  });

  it('says the standings are updating and offers no Finalise',
    { meta: { type: 'covers', description: 'standings: Updating standings' } }, async () => {
      const { page, text, button } = await open(() => of(resolved), tournament(), resolvedMatches(6, 8));

      expect(text('.review herald-notice')).toContain('Standings are updating');
      expect(text('.review herald-notice')).toContain('Results revision 8 has not reached the standings yet (revision 7)');
      expect(button('Finalise')).toBeUndefined();
      expect(await violations(page())).toEqual([]);
    });

  it('finalises at the reviewed revision and shows the final competition', async () => {
    let schedule = resolvedMatches(6, 7);
    const finaliseCompetition = vi.fn(() => {
      schedule = finalised;
      return of(finalised);
    });
    const { page, button, text, toasts, settle } = await open(() => of(resolved), tournament(), schedule, { getSchedule: () => of(schedule), finaliseCompetition });

    button('Finalise').click();
    await vi.waitFor(() => expect(toasts()).toContain('Saturday Open finalised.'));
    await settle();

    expect(finaliseCompetition).toHaveBeenCalledWith(organisation, tournamentId, { reviewedRevision: 7, expectedRevision: 9 });
    expect(text('.title herald-status-label')).toBe('Final');
    expect(text('.final-summary')).toContain('Final revision 1 · results revision 7');
    expect(text('.final-summary')).toContain('Finalised by Alex Morgan');
    expect(button('Reopen')).toBeTruthy();
    expect(text('.history summary')).toBe('Final revisions');
    expect(text('.history li')).toContain('current');
    expect(await violations(page())).toEqual([]);
  });

  it('shows Finalising while the request runs', async () => {
    const { page, button, text, settle } = await open(() => of(resolved), tournament(), resolvedMatches(6, 7), { finaliseCompetition: () => new Observable<never>() });

    button('Finalise').click();
    await settle();

    expect(text('.review [role="status"]')).toBe('Finalising. Please wait; do not submit again.');
    expect(page().querySelector('.review button')?.textContent?.trim()).toBe('Finalising…');
  });

  it('asks for a new review when the standings changed since the review', async () => {
    const changed = resolvedMatches(6, 8);
    const finaliseCompetition = () => throwError(() => problem(400, { errors: { review: ['stale'] }, schedule: changed }));
    const { page, button, text, settle } = await open(() => of(resolved), tournament(), resolvedMatches(6, 7), { finaliseCompetition });

    button('Finalise').click();
    await vi.waitFor(() => expect(text('.review herald-notice')).toContain('Standings changed since your review'));
    await settle();

    expect(text('.review herald-notice')).toContain('moved the results to revision 8 while you reviewed revision 7. Nothing was finalised.');
    expect(button('Review again')).toBeTruthy();
    expect(button('Finalise')).toBeUndefined();
    expect(await violations(page())).toEqual([]);
  });

  it('says that no champion is declared when every entrant departed', async () => {
    const departed: StandingsView = {
      ...resolved,
      rows: resolved.rows.map((row) => ({ ...row, entrant: { ...row.entrant, status: 'withdrawn' as const } })),
      final: { number: 1, resultsRevision: 7, finalisedAt: '2026-11-29T17:10:00Z', reopened: false },
      noChampion: true,
    };
    const { page, text } = await open(() => of(departed), tournament({ competition: 'finalised' }), finalised);

    expect(text('.column > herald-notice')).toContain('No active entrant');
    expect(text('.column > herald-notice')).toContain('no champion is declared');
    expect(await violations(page())).toEqual([]);
  });

  it('reopens with a required reason and lists the earlier final revision', async () => {
    const reopened = resolvedMatches(6, 7, { finals: [final({ reopenReason: 'Result appeal upheld', reopenedAt: '2026-11-30T09:05:00Z', reopenedBy: 'Alex Morgan' })] });
    let schedule = finalised;
    const reopenCompetition = vi.fn(() => {
      schedule = reopened;
      return of(reopened);
    });
    const { page, button, text, toasts, settle } = await open(() => of(resolved), tournament({ competition: 'finalised' }), schedule, { getSchedule: () => of(schedule), reopenCompetition });

    button('Reopen').click();
    await settle();
    expect(document.querySelector('[role=dialog] h2')?.textContent).toContain('Reopen Saturday Open?');
    expect(await violations(document.querySelector('[role=dialog]') as HTMLElement)).toEqual([]);
    dialogButton('Reopen').click();
    await settle();
    expect(document.getElementById('reopen-reason-error')?.textContent?.trim()).toBe('Error: Enter a reason.');
    expect(reopenCompetition).not.toHaveBeenCalled();

    const reason = document.getElementById('reopen-reason') as HTMLTextAreaElement;
    reason.value = 'Result appeal upheld';
    reason.dispatchEvent(new Event('input'));
    await settle();
    dialogButton('Reopen').click();
    await vi.waitFor(() => expect(toasts()).toContain('Saturday Open reopened.'));
    await settle();

    expect(reopenCompetition).toHaveBeenCalledWith(organisation, tournamentId, { reason: 'Result appeal upheld', expectedRevision: 9 });
    expect(text('#review-heading')).toBe('Review and finalise');
    expect(text('.history li')).toContain('Reason: Result appeal upheld');
    expect(page().querySelector('.history')?.hasAttribute('open')).toBe(true);
  });
});
