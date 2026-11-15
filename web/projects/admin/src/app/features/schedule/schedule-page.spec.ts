import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EntrantDetails, HeraldHostAdminService, PairingsDetails, PublicationDetails, ScheduleDetails, TournamentDetails } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { of, throwError } from 'rxjs';
import { AccessState, AppContext, QUERY_CLIENT, Session } from '../../platform';
import { SchedulePage } from './schedule-page';

const organisation = '0198f000-0000-7000-8000-00000000000a';
const tournamentId = '0198f000-0000-7000-8000-0000000000f1';

const tournament = (over: Partial<TournamentDetails> = {}): TournamentDetails => ({
  id: tournamentId,
  revision: 3,
  publication: 'published',
  registration: 'closed',
  competition: 'preparation',
  profile: 'singleRoundRobin-3-1-0',
  configuration: { title: 'Saturday Open', entryKind: 'individual', capacity: 8, timeZone: 'Europe/Madrid' },
  missingForPublication: [],
  missingForRegistration: [],
  registrationChangedAt: null,
  admittedEntries: 4,
  waitingEntries: 0,
  checkedInEntries: 0,
  schedulePublished: false,
  start: { conditions: [], eligible: null, pending: null, rostersOutsideBounds: null, sharedMemberNames: [], publishedScheduleRevision: null, startedAt: null, startedOnScheduleRevision: null },
  ...over,
});

const person = (name: string): EntrantDetails => ({ entryId: `e-${name.replaceAll(' ', '-')}`, name });
const [robin, sam, jamie, taylor, rowan] = ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch', 'Rowan Lake'].map(person);

const four: PairingsDetails = {
  seeding: 'admissionOrder',
  seed: null,
  entrants: 4,
  matches: 6,
  rounds: [
    { number: 1, matches: [{ first: robin, second: taylor }, { first: sam, second: jamie }], rest: null },
    { number: 2, matches: [{ first: robin, second: jamie }, { first: taylor, second: sam }], rest: null },
    { number: 3, matches: [{ first: robin, second: sam }, { first: jamie, second: taylor }], rest: null },
  ],
};

const five: PairingsDetails = {
  seeding: 'draw',
  seed: 48213,
  entrants: 5,
  matches: 10,
  rounds: [robin, sam, jamie, taylor, rowan].map((rest, index) => ({ number: index + 1, matches: [], rest })),
};

const publication = (number: number, over: Partial<PublicationDetails> = {}): PublicationDetails => ({
  number,
  pairings: four,
  publishedAt: '2026-11-21T08:55:00Z',
  withdrawalReason: null,
  withdrawnAt: null,
  ...over,
});

const schedule = (over: Partial<ScheduleDetails> = {}): ScheduleDetails => ({
  tournamentId,
  revision: 4,
  registrationClosed: true,
  pending: [],
  eligible: 4,
  blockers: [],
  draft: null,
  draftChange: null,
  current: null,
  crossedChange: null,
  history: [],
  startedOnRevision: null,
  startedAt: null,
  startCrossedWithdrawal: false,
  matches: [],
  ...over,
});

const draft = (pairings = four, stale = false) => ({ pairings, generatedAt: '2026-11-21T08:50:00Z', stale });

const problem = (status: number, body: object = {}) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });

async function open(api: Record<string, unknown>, details: TournamentDetails = tournament()) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/tournaments/:tournamentId/schedule', component: SchedulePage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null) } },
      { provide: HeraldHostAdminService, useValue: { getTournament: () => of(details), ...api } },
    ],
  });
  const harness = await RouterTestingHarness.create(`/organisations/${organisation}/tournaments/${tournamentId}/schedule`);
  document.body.appendChild(harness.fixture.nativeElement);
  const all = () => document.body;
  return {
    page: () => harness.routeNativeElement as HTMLElement,
    settle: () => harness.fixture.whenStable(),
    button: (text: string) => [...all().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text),
    text: (selector: string) => all().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(),
    texts: (selector: string) => [...all().querySelectorAll(selector)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()),
    toasts: () => TestBed.inject(Toasts).toasts().map((toast) => toast.text),
    type: (selector: string, value: string) => {
      const input = all().querySelector<HTMLTextAreaElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    },
  };
}

const violations = async (page: HTMLElement) =>
  (await axe.run(page, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

describe('The schedule page', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.querySelectorAll('herald-dialog').forEach((element) => element.remove());
  });

  it('lists what blocks generating, each with where to fix it',
    { meta: { type: 'covers', description: 'round-robin-pairings: Entries are pending' } }, async () => {
      const blocked = schedule({ registrationClosed: false, pending: [sam, rowan], blockers: ['registration-not-closed', 'entries-pending'] });
      const { page, button, text, texts } = await open({ getSchedule: () => of(blocked) });
      await vi.waitFor(() => expect(text('#generate-heading')).toBe('Before generating'));

      expect(texts('.checks strong')).toEqual(['Registration closed', 'No entry pending check-in']);
      expect(text('.checks li:nth-child(2) .help')).toContain('Pending: Sam Reed, Rowan Lake.');
      expect(texts('.checks herald-status-label')).toEqual(['Not met', 'Not met']);
      expect(button('Generate draft')?.disabled).toBe(true);
      expect(text('#generate-why')).toBe('Close registration on the configuration page.');
      expect(await violations(page())).toEqual([]);
    });

  it('generates a draft with the seeding the owner chose, nothing preselected',
    { meta: { type: 'covers', description: 'round-robin-pairings: Four individual entrants' } }, async () => {
      const generateDraft = vi.fn(() => of(schedule({ revision: 5, draft: draft() })));
      const { page, button, text, texts, toasts, settle } = await open({ getSchedule: () => of(schedule()), generateDraft });
      await vi.waitFor(() => expect(text('#summary-heading')).toBe('Generate a draft'));
      expect(button('Generate draft')?.disabled).toBe(true);
      expect(text('#generate-why')).toBe('Choose the seeding first.');

      page().querySelector<HTMLInputElement>('input[value="admissionOrder"]')!.click();
      await settle();
      button('Generate draft')!.click();
      await vi.waitFor(() => expect(toasts()).toContain('Draft generated.'));

      expect(generateDraft).toHaveBeenCalledWith(organisation, tournamentId, expect.objectContaining({ expectedRevision: 4, seeding: 'admissionOrder' }));
      expect(text('#summary-heading')).toBe('4 players · 3 rounds · 6 matches');
      expect(text('.summary herald-status-label')).toBe('Draft');
      expect(texts('.group h2')).toEqual(['Round 1', 'Round 2', 'Round 3']);
      expect(texts('.matches li')[0]).toBe('Robin Vale vs Taylor Finch');
      expect(await violations(page())).toEqual([]);
    });

  it('shows each round’s rest without points and the recorded seed of a draw',
    { meta: { type: 'covers', description: 'round-robin-pairings: Five entrants rest once each' } }, async () => {
      const { text, texts } = await open({ getSchedule: () => of(schedule({ eligible: 5, draft: draft(five) })) });
      await vi.waitFor(() => expect(text('#summary-heading')).toBe('5 players · 5 rounds · 10 matches'));
      expect(text('.summary .help')).toContain('Draw · seed 48213');
      expect(texts('.rest')).toEqual(['Rest: Robin Vale · no points', 'Rest: Sam Reed · no points', 'Rest: Jamie Brook · no points', 'Rest: Taylor Finch · no points', 'Rest: Rowan Lake · no points']);
    });

  it('names what changed and refuses to publish a stale draft',
    { meta: { type: 'covers', description: 'round-robin-pairings: An absence makes the draft stale' } }, async () => {
      const stale = schedule({ eligible: 3, draft: draft(four, true), draftChange: { added: [], removed: [sam] } });
      const { page, button, text } = await open({ getSchedule: () => of(stale) });
      await vi.waitFor(() => expect(text('.summary herald-status-label')).toBe('Stale draft'));
      expect(text('herald-notice')).toContain('No longer eligible: Sam Reed.');
      expect(button('Publish')?.disabled).toBe(true);
      expect(await violations(page())).toEqual([]);
    });

  it('publishes the draft and locks the field',
    { meta: { type: 'covers', description: 'round-robin-pairings: The owner publishes' } }, async () => {
      const publishSchedule = vi.fn(() => of(schedule({ revision: 6, current: publication(1), history: [publication(1)] })));
      const { button, text, toasts } = await open({ getSchedule: () => of(schedule({ revision: 5, draft: draft() })), publishSchedule });
      await vi.waitFor(() => expect(button('Publish')).toBeTruthy());

      button('Publish')!.click();
      await vi.waitFor(() => expect(toasts()).toContain('Schedule published · revision 1.'));

      expect(publishSchedule).toHaveBeenCalledWith(organisation, tournamentId, { expectedRevision: 5 });
      expect(text('.summary herald-status-label')).toBe('Published · revision 1');
      expect(text('.summary .help')).toContain('published 21 November 2026, 09:55 · Europe/Madrid');
      expect(button('Withdraw')).toBeTruthy();
      expect(text('.column herald-notice')).toContain('The field is locked');
    });

  it('offers no withdrawal or generation once the competition is running', async () => {
    const { button, text } = await open({ getSchedule: () => of(schedule({ revision: 7, current: publication(1), history: [publication(1)], startedOnRevision: 1, startedAt: '2026-11-21T09:05:00Z' })) });
    await vi.waitFor(() => expect(text('.column herald-notice')).toContain('The competition started on revision 1. The schedule can no longer be withdrawn or regenerated.'));
    expect(button('Withdraw')).toBeUndefined();
    expect(button('Generate draft')).toBeUndefined();
  });

  it('links each match of a running competition to its page with its state and result', async () => {
    const matches = [
      { matchId: 'm-1', round: 1, first: robin, second: taylor, state: 'inPlay' as const, result: null },
      { matchId: 'm-2', round: 1, first: sam, second: jamie, state: 'scheduled' as const, result: null },
      { matchId: 'm-3', round: 2, first: robin, second: jamie, state: 'resolved' as const, result: { outcome: 'second' as const, cause: 'played' as const, played: true, reason: null, recordedAt: '2026-11-21T10:00:00Z' } },
    ];
    const { texts, page } = await open({ getSchedule: () => of(schedule({ revision: 7, current: publication(1), startedOnRevision: 1, startedAt: '2026-11-21T09:05:00Z', matches })) });
    await vi.waitFor(() => expect(texts('.running herald-status-label')).toEqual(['In play', 'Scheduled', 'Resolved']));
    expect(texts('.running .outcome')).toEqual(['Jamie Brook won']);
    expect(page().querySelector('.running a')?.getAttribute('href')).toContain('/matches/m-1');
    expect(await violations(page())).toEqual([]);
  });

  it('states each exceptional cause in words with no score',
    { meta: { type: 'covers', description: 'match-results: A concession on the schedule' } }, async () => {
      const resolved = (result: { outcome: 'first' | 'second' | 'none'; cause: 'concession' | 'doubleAbsence' | 'noContest'; played: boolean; reason: string | null }) =>
        ({ state: 'resolved' as const, result: { ...result, recordedAt: '2026-11-21T10:00:00Z' } });
      const matches = [
        { matchId: 'm-1', round: 1, first: sam, second: jamie, ...resolved({ outcome: 'second', cause: 'concession', played: false, reason: null }) },
        { matchId: 'm-2', round: 1, first: robin, second: taylor, ...resolved({ outcome: 'none', cause: 'doubleAbsence', played: false, reason: null }) },
        { matchId: 'm-3', round: 2, first: robin, second: jamie, ...resolved({ outcome: 'none', cause: 'noContest', played: true, reason: 'Venue closed' }) },
      ];
      const { texts, page } = await open({ getSchedule: () => of(schedule({ revision: 7, current: publication(1), startedOnRevision: 1, startedAt: '2026-11-21T09:05:00Z', matches })) });
      await vi.waitFor(() => expect(texts('.running .outcome')).toEqual([
        'Both were absent · 0 each · no play recorded',
        'Sam Reed conceded before play · Jamie Brook wins · no play recorded',
        'No contest: Venue closed · 0 each · play recorded',
      ]));
      expect(page().textContent).not.toMatch(/\d+\s*[-–]\s*\d+/);
      expect(await violations(page())).toEqual([]);
    });

  it('reports a start on a withdrawn revision and offers to publish the draft once', async () => {
    const withdrawn = publication(1, { withdrawnAt: '2026-11-21T09:04:00Z', withdrawalReason: 'Late absence' });
    const { button, text } = await open({
      getSchedule: () => of(schedule({ revision: 8, draft: draft(), history: [withdrawn], startedOnRevision: 1, startedAt: '2026-11-21T09:05:00Z', startCrossedWithdrawal: true })),
    });
    await vi.waitFor(() => expect(text('.column herald-notice strong')).toBe('The competition started on revision 1, which was withdrawn'));
    expect(button('Publish')).toBeTruthy();
    expect(button('Regenerate')).toBeUndefined();
  });

  it('requires a reason to withdraw and keeps the revision in the history',
    { meta: { type: 'covers', description: 'round-robin-pairings: Withdraw and republish' } }, async () => {
      const withdrawn = publication(1, { withdrawnAt: '2026-11-21T08:58:00Z', withdrawalReason: 'Late absence' });
      const withdrawSchedule = vi.fn(() => of(schedule({ revision: 7, draft: draft(), history: [withdrawn] })));
      const { page, button, text, toasts, type, settle } = await open({ getSchedule: () => of(schedule({ revision: 6, current: publication(1), history: [publication(1)] })), withdrawSchedule });
      await vi.waitFor(() => expect(button('Withdraw')).toBeTruthy());

      button('Withdraw')!.click();
      await settle();
      const confirm = () => [...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find((b) => b.textContent?.trim() === 'Withdraw')!;
      confirm().click();
      await settle();
      expect(text('#withdraw-reason-error')).toBe('Error: Enter a reason.');
      expect(withdrawSchedule).not.toHaveBeenCalled();

      type('#withdraw-reason', 'Late absence');
      confirm().click();
      await vi.waitFor(() => expect(toasts()).toContain('Revision 1 withdrawn.'));

      expect(withdrawSchedule).toHaveBeenCalledWith(organisation, tournamentId, { expectedRevision: 6, reason: 'Late absence' });
      expect(text('.summary herald-status-label')).toBe('Draft');
      expect(text('.history li')).toContain('Reason: Late absence');
      expect(await violations(page())).toEqual([]);
    });

  it('reports a field change that crossed the publication and keeps the pairings',
    { meta: { type: 'covers', description: 'round-robin-pairings: A cancellation crossed the publication' } }, async () => {
      const crossed = schedule({ eligible: 3, current: publication(1), history: [publication(1)], crossedChange: { added: [], removed: [sam] } });
      const { text, texts } = await open({ getSchedule: () => of(crossed) });
      await vi.waitFor(() => expect(text('herald-notice')).toContain('The field changed since publication'));
      expect(text('herald-notice')).toContain('No longer eligible: Sam Reed.');
      expect(texts('.matches li')).toHaveLength(6);
    });

  it('offers to reload when another tab changed the schedule',
    { meta: { type: 'covers', description: 'round-robin-pairings: Another tab published first' } }, async () => {
      const publishSchedule = vi.fn(() => throwError(() => problem(409, { type: 'schedule-revision-conflict', currentRevision: 6 })));
      const { button, text } = await open({ getSchedule: () => of(schedule({ revision: 5, draft: draft() })), publishSchedule });
      await vi.waitFor(() => expect(button('Publish')).toBeTruthy());

      button('Publish')!.click();
      await vi.waitFor(() => expect(text('herald-notice')).toContain('This schedule changed elsewhere'));
      expect(button('Reload latest')).toBeTruthy();
    });

  it('reads a republished schedule with its rounds and the withdrawn revision in the history',
    { meta: { type: 'covers', description: 'round-robin-pairings: The owner reads a published schedule' } }, async () => {
      const first = publication(1, { withdrawnAt: '2026-11-21T08:58:00Z', withdrawalReason: 'Late absence' });
      const second = publication(2, { publishedAt: '2026-11-21T09:02:00Z' });
      const { page, text, texts } = await open({ getSchedule: () => of(schedule({ revision: 9, current: second, history: [second, first] })) });
      await vi.waitFor(() => expect(text('.summary herald-status-label')).toBe('Published · revision 2'));
      expect(texts('.group h2')).toEqual(['Round 1', 'Round 2', 'Round 3']);
      expect(texts('.history li strong')).toEqual(['Revision 2', 'Revision 1']);
      expect(texts('.history li .help')[1]).toContain('Reason: Late absence');
      expect(await violations(page())).toEqual([]);
    });

  it('says when the field has not been reported yet', async () => {
      const { text } = await open({ getSchedule: () => throwError(() => problem(404)) });
      await vi.waitFor(() => expect(text('herald-notice')).toContain('No eligible field reported yet'));
    });
});
