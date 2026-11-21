import { HttpErrorResponse } from '@angular/common/http';
import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeraldHostPublicService, PublicMatch, PublicStandings, PublicTournamentView } from '@herald/api-client/public';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { Observable, of, throwError } from 'rxjs';
import { TournamentPage } from './tournament-page';

const id = '0198f000-0000-7000-8000-0000000000f1';
const match = (first: string, second: string, over: Partial<PublicMatch> = {}): PublicMatch => ({ first, second, state: 'scheduled', outcome: null, cause: null, ...over });
const played = (first: string, second: string, outcome: PublicMatch['outcome']) => match(first, second, { state: 'resolved', outcome, cause: 'played' });

// The prototype's Saturday Open (h1-public-read Visual input): four players, three rounds.
const before: PublicTournamentView = {
  id, title: 'Saturday Open', organiser: 'Northside Gaming', gameVariant: 'Generic card game', entryKind: 'individual',
  minimumRosterSize: null, maximumRosterSize: null, activePlayersPerSide: null, location: 'onSite', venue: 'Northside Hall',
  registrationOpensAt: '2026-11-15T09:00:00', registrationClosesAt: '2026-11-21T18:00:00', plannedStartAt: '2026-11-22T10:00:00', timeZone: 'Europe/Madrid',
  visibility: 'public', registration: 'open', competition: 'preparation', cancelledAt: null, rounds: [], standings: null,
  changes: [{ kind: 'tournamentPublished', subjectRevision: 2, at: '2026-11-10T08:00:00Z', changes: [], timeZone: null, cause: null }],
};

const rounds = (r1: PublicMatch[], r2: PublicMatch[], r3: PublicMatch[]) => [
  { number: 1, matches: r1, rest: null }, { number: 2, matches: r2, rest: null }, { number: 3, matches: r3, rest: null },
];

const standings = (over: Partial<PublicStandings> = {}): PublicStandings => ({
  final: false, finalRevision: null, revised: false, resultsRevision: 9, updatedAt: '2026-11-22T10:40:00Z', resolvedMatches: 3, matches: 6, noChampion: false,
  rows: [
    { position: 1, shared: false, name: 'Robin Vale', status: 'active', resolved: 2, won: 2, drawn: 0, lost: 0, points: 6,
      lines: [{ round: 1, opponent: 'Sam Reed', result: 'won', cause: 'played', points: 3 }, { round: 2, opponent: 'Jamie Brook', result: 'won', cause: 'singleAbsence', points: 3 }],
      remaining: [{ round: 3, opponent: 'Taylor Finch' }] },
    { position: 2, shared: true, name: 'Jamie Brook', status: 'active', resolved: 2, won: 0, drawn: 1, lost: 1, points: 1, lines: [], remaining: [] },
    { position: 2, shared: true, name: 'Taylor Finch', status: 'active', resolved: 1, won: 0, drawn: 1, lost: 0, points: 1, lines: [], remaining: [] },
    { position: 4, shared: false, name: 'Sam Reed', status: 'withdrawn', resolved: 1, won: 0, drawn: 0, lost: 1, points: 0, lines: [], remaining: [] },
  ],
  ...over,
});

const running: PublicTournamentView = {
  ...before, registration: 'closed', competition: 'running',
  rounds: rounds(
    [played('Robin Vale', 'Sam Reed', 'first'), played('Jamie Brook', 'Taylor Finch', 'draw')],
    [match('Robin Vale', 'Jamie Brook', { state: 'resolved', outcome: 'first', cause: 'singleAbsence' }), match('Sam Reed', 'Taylor Finch', { state: 'inPlay' })],
    [match('Robin Vale', 'Taylor Finch'), match('Sam Reed', 'Jamie Brook')]),
  standings: standings(),
};

async function open(answer: () => Observable<PublicTournamentView>, response: ResponseInit | null = null) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'tournaments/:tournamentId', component: TournamentPage }]),
      provideTanStackQuery(client),
      { provide: HeraldHostPublicService, useValue: { getPublicTournament: answer } },
      { provide: RESPONSE_INIT, useValue: response },
    ],
  });
  const harness = await RouterTestingHarness.create(`/tournaments/${id}`);
  document.body.appendChild(harness.fixture.nativeElement);
  const page = () => harness.routeNativeElement as HTMLElement;
  await vi.waitFor(() => expect(page().querySelector('[role="status"]')).toBeNull());
  await harness.fixture.whenStable();
  return {
    page,
    harness,
    text: (selector: string) => page().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(),
    texts: (selector: string) => [...page().querySelectorAll(selector)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()),
  };
}

const violations = async (page: HTMLElement) => (await axe.run(page, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

describe('The public tournament page', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows a published tournament before start with its details and no rounds or standings (public-before-start)', async () => {
    const { page, text, texts } = await open(() => of(before));

    expect(text('h1')).toBe('Saturday Open');
    expect(texts('.labels herald-status-label')).toEqual(['Registration open', 'Preparing']);
    expect(texts('.facts dd')).toEqual([
      'Northside Gaming', 'Generic card game', 'Northside Hall', '15 November 2026, 09:00 to 21 November 2026, 18:00 · Europe/Madrid',
      '22 November 2026, 10:00 · Europe/Madrid', 'Individual · single round-robin',
    ]);
    expect(page().querySelector('#rounds')).toBeNull();
    expect(page().querySelector('#standings')).toBeNull();
    expect(texts('.changes li p:first-child')).toEqual(['Tournament published']);
    expect(await violations(page())).toEqual([]);
  });

  it('shows the published rounds, all scheduled, once the schedule is published (public-schedule)', async () => {
    const { page, texts } = await open(() => of({
      ...before, registration: 'closed',
      rounds: rounds([match('Robin Vale', 'Sam Reed'), match('Jamie Brook', 'Taylor Finch')], [match('Robin Vale', 'Jamie Brook')], [match('Robin Vale', 'Taylor Finch')]),
    }));

    expect(texts('.round h3')).toEqual(['Round 1', 'Round 2', 'Round 3']);
    expect(texts('.matches herald-status-label').every((label) => label === 'Scheduled')).toBe(true);
    expect(page().querySelector('#standings')).toBeNull();
    expect(await violations(page())).toEqual([]);
  });

  it('shows causes in words and provisional standings with the results revision and time (public-running)', async () => {
    const { page, text, texts } = await open(() => of(running));

    expect(texts('.labels herald-status-label')).toEqual(['Registration closed', 'Running']);
    expect(texts('.outcome')).toEqual(['Robin Vale won', 'Draw', 'Jamie Brook was absent · Robin Vale wins']);
    expect(text('#standings + p')).toBe('Provisional · results revision 9 · updated 22 November 2026, 11:40 Europe/Madrid');
    expect(texts('tbody tr td:first-child span[aria-hidden]')).toEqual(['1', '2=', '2=', '4']);
    expect(text('tbody tr:last-child herald-status-label')).toBe('Withdrawn');
    expect(page().querySelectorAll('th.wide').length).toBe(4);
    expect(await violations(page())).toEqual([]);
  });

  it('opens an entrant’s explanation with its matches, rest and remaining matches (public-explained)', async () => {
    const { page, harness, texts } = await open(() => of(running));
    const robin = page().querySelector<HTMLButtonElement>('tbody button.link')!;

    robin.click();
    await harness.fixture.whenStable();

    expect(robin.getAttribute('aria-expanded')).toBe('true');
    expect(texts('.explain li')).toEqual([
      'Round 1 · vs Sam Reed · won · played · 3 points', 'Round 2 · vs Jamie Brook · won · single absence · 3 points', 'Round 3 · vs Taylor Finch · to play',
    ]);
    expect(await violations(page())).toEqual([]);
  });

  it('says final with its final revision (public-final)', async () => {
    const { page, text, texts } = await open(() => of({
      ...running, competition: 'finalised', standings: standings({ final: true, finalRevision: 1, resolvedMatches: 6, updatedAt: '2026-11-22T17:10:00Z' }),
      changes: [{ kind: 'competitionFinalised', subjectRevision: 1, at: '2026-11-22T17:10:00Z', changes: [], timeZone: null, cause: null }, ...before.changes],
    }));

    expect(texts('.labels herald-status-label')).toEqual(['Registration closed', 'Finalised']);
    expect(text('#standings + p')).toBe('Final · final revision 1 · updated 22 November 2026, 18:10 Europe/Madrid');
    expect(texts('.changes li p:first-child')[0]).toBe('Final standings (final revision 1)');
    expect(await violations(page())).toEqual([]);
  });

  it('says final standings were revised after reopening (public-revised)', async () => {
    const { page, text, texts } = await open(() => of({
      ...running, competition: 'finalised', standings: standings({ final: true, finalRevision: 2, revised: true, resolvedMatches: 6, updatedAt: '2026-11-23T10:30:00Z' }),
      changes: [{ kind: 'competitionFinalised', subjectRevision: 2, at: '2026-11-23T10:30:00Z', changes: [], timeZone: null, cause: null }, ...before.changes],
    }));

    expect(text('#standings + p')).toBe('Final · final revision 2 (revised after reopening) · updated 23 November 2026, 11:30 Europe/Madrid');
    expect(texts('.changes li p:first-child')[0]).toBe('Final standings revised (final revision 2)');
    expect(await violations(page())).toEqual([]);
  });

  it('says a tournament was cancelled and when, shows the voided matches and declares no champion (public-cancelled)',
    { meta: { type: 'covers', description: 'public-tournament-page: Cancelled' } }, async () => {
      const voided = (first: string, second: string) => match(first, second, { state: 'resolved', outcome: 'none', cause: 'voidedCancelled' });
      const { page, text, texts } = await open(() => of({
        ...running, competition: 'cancelled', cancelledAt: '2026-11-23T14:20:00Z',
        rounds: rounds([played('Robin Vale', 'Sam Reed', 'first')], [voided('Robin Vale', 'Jamie Brook')], [voided('Robin Vale', 'Taylor Finch')]),
        standings: standings({ noChampion: true }),
        changes: [{ kind: 'tournamentCancelled', subjectRevision: 7, at: '2026-11-23T14:20:00Z', changes: [], timeZone: null, cause: null }, ...before.changes],
      }));

      expect(text('herald-notice')).toContain('Cancelled on 23 November 2026, 15:20 Europe/Madrid.');
      expect(text('herald-notice')).toContain('no champion is declared');
      expect(texts('.matches herald-status-label')).toEqual(['Resolved', 'Voided', 'Voided']);
      expect(text('#standings + p')).toBe('Cancelled · no champion or final ranking');
      expect(texts('.changes li p:first-child')[0]).toBe('Tournament cancelled');
      expect(await violations(page())).toEqual([]);
    });

  it('answers a tournament the API does not offer with "not available" and status 404 (public-not-available)',
    { meta: { type: 'covers', description: 'public-tournament-page: A private tournament' } }, async () => {
      const response: ResponseInit = {};
      const { page, text } = await open(() => throwError(() => new HttpErrorResponse({ status: 404 })), response);

      expect(text('h1')).toBe('This tournament is not available');
      expect(page().querySelector('a')?.getAttribute('href')).toBe('/');
      expect(response.status).toBe(404);
      expect((response.headers as Record<string, string>)['Cache-Control']).toBe('no-store');
      expect(await violations(page())).toEqual([]);
    });
});
