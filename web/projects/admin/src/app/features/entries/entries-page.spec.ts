import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EntryDetails, FieldDetails, HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Toasts } from '@herald/ui';
import { AccessState, AppContext, QUERY_CLIENT, Session } from '../../platform';
import { EntriesPage } from './entries-page';

const organisation = '0198f000-0000-7000-8000-00000000000a';
const tournamentId = '0198f000-0000-7000-8000-0000000000f1';

const tournament = (over: Partial<TournamentDetails> = {}): TournamentDetails => ({
  id: tournamentId,
  revision: 3,
  publication: 'published',
  registration: 'open',
  competition: 'preparation',
  profile: 'singleRoundRobin-3-1-0',
  configuration: {
    title: 'Saturday Open',
    gameVariant: 'Card game · Constructed',
    entryKind: 'individual',
    capacity: 2,
    plannedStartAt: '2026-11-21T10:00:00',
    timeZone: 'Europe/Madrid',
    location: 'onSite',
    venue: 'Madrid',
    admission: 'automatic',
  },
  missingForPublication: [],
  missingForRegistration: [],
  registrationChangedAt: null,
  admittedEntries: 0,
  waitingEntries: 0,
  ...over,
});

let sequence = 0;
const entry = (guestName: string, over: Partial<EntryDetails> = {}): EntryDetails => ({
  id: `e-${guestName.replaceAll(' ', '-')}`,
  revision: 1,
  guestId: `g-${guestName}`,
  guestName,
  state: 'admitted',
  waitingReason: null,
  position: null,
  enteredAt: '2026-11-11T09:00:00Z',
  waitingSince: null,
  admissionMethod: 'automatic',
  admittedAt: `2026-11-11T09:0${sequence++ % 10}:00Z`,
  cancelledAt: null,
  ...over,
});
const waiting = (guestName: string, position: number, waitingReason: 'capacityFull' | 'admissionPending' = 'capacityFull') =>
  entry(guestName, { state: 'waiting', waitingReason, position, waitingSince: `2026-11-11T09:0${position}:00Z`, admissionMethod: null, admittedAt: null });
const cancelled = (guestName: string) => entry(guestName, { state: 'cancelled', cancelledAt: '2026-11-11T08:45:00Z', admittedAt: null });

const field = (entries: EntryDetails[], terms: Partial<FieldDetails['terms']> = {}, over: Partial<FieldDetails> = {}): FieldDetails => ({
  tournamentId,
  revision: 5,
  terms: { registration: 'open', capacity: 2, entryKind: 'individual', admission: 'automatic', ...terms },
  termsReceivedAt: '2026-11-11T09:10:00Z',
  admitted: entries.filter((e) => e.state === 'admitted').length,
  waiting: entries.filter((e) => e.state === 'waiting').length,
  overCapacityBy: 0,
  kindMismatch: false,
  entries,
  ...over,
});

const full = () => field([entry('Robin Vale'), entry('Sam Reed'), waiting('Ellis Stone', 1)]);

const problem = (status: number, body: object = {}) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });

async function open(api: Record<string, unknown>, details: TournamentDetails = tournament()) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/tournaments/:tournamentId/entries', component: EntriesPage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null) } },
      {
        provide: HeraldHostAdminService,
        useValue: { getOrganisation: () => of({ id: organisation, name: 'Northside Gaming' }), getTournament: () => of(details), ...api },
      },
    ],
  });
  const harness = await RouterTestingHarness.create(`/organisations/${organisation}/tournaments/${tournamentId}/entries`);
  document.body.appendChild(harness.fixture.nativeElement);
  const page = () => harness.routeNativeElement as HTMLElement;
  // Dialogs and the drawer render over the page, outside it: queries look at the whole document.
  const all = () => document.body;
  const button = (text: string) => [...all().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text);
  const type = (selector: string, value: string) => {
    const input = all().querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  return {
    page,
    button,
    type,
    settle: () => harness.fixture.whenStable(),
    text: (selector: string) => all().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(),
    texts: (selector: string) => [...all().querySelectorAll(selector)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()),
    toasts: () => TestBed.inject(Toasts).toasts().map((toast) => toast.text),
    dialog: () => document.querySelector<HTMLElement>('[role=dialog]'),
    heading: () => document.getElementById(document.querySelector('[role=dialog]')!.getAttribute('aria-labelledby')!)?.textContent?.trim(),
  };
}

/** Answers in order, one per call. */
const answers = <T>(...list: (() => Observable<T>)[]) => vi.fn(() => list.shift()!());

const violations = async (page: HTMLElement) =>
  (await axe.run(page, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

describe('The entries page', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.querySelectorAll('herald-dialog, herald-drawer').forEach((element) => element.remove());
  });

  it('shows an empty open field with adding a player as its one primary action', async () => {
    const { page, text, texts } = await open({ getField: () => of(field([])) });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('0 of 2 individual entries'));

    expect(text('h1')).toBe('Entries · Saturday Open');
    expect(texts('herald-status-label')).toEqual(['Published', 'Registration open', 'Preparing']);
    expect(texts('.summary .help')).toEqual(['Automatic admission · 0 waiting for a slot', 'Entry terms updated 11 November 2026, 10:10 · Europe/Madrid']);
    expect(text('#empty-heading')).toBe('No entries yet');
    expect(texts('.group h2')).toEqual(['Admitted · 0', 'Waiting · 0']);
    // No history, no cancelled group.
    expect(page().querySelector('details.cancelled')).toBeNull();
    expect(page().querySelector('a.back')?.getAttribute('href')).toBe(`/organisations/${organisation}/tournaments/${tournamentId}`);
    expect(await violations(page())).toEqual([]);
  });

  it('says registration must be open to add entries when it is not open', async () => {
    const { button, text } = await open({ getField: () => of(field([], { registration: 'notOpen' })) }, tournament({ registration: 'notOpen' }));
    await vi.waitFor(() => expect(button('Add player')?.disabled).toBe(true));
    expect(text('#add-reason')).toBe('Registration is not open. Open registration in configuration to add entries.');
  });

  it('shows a full automatic field: two admitted, one waiting with its reason, and admission unavailable with why', async () => {
    const { page, text, texts } = await open({ getField: () => of(full()) });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 2 individual entries'));

    expect(texts('ul[aria-labelledby="admitted-heading"] h3')).toEqual(['Robin Vale', 'Sam Reed']);
    expect(texts('ol h3')).toEqual(['1. Ellis Stone']);
    expect(text('ol li .help')).toBe('Capacity full · Waiting since 11 November 2026, 10:01 · Europe/Madrid');
    const admit = page().querySelector<HTMLButtonElement>('ol button')!;
    expect(admit.disabled).toBe(true);
    expect(page().querySelector(`#${admit.getAttribute('aria-describedby')}`)?.textContent).toBe('No free slot. Cancel an admitted entry or increase capacity.');
    expect(await violations(page())).toEqual([]);
  });

  it('admits a pending team at once under manual admission', async () => {
    const pending = field([entry('North Stars'), waiting('Cedar Owls', 1, 'admissionPending')], { entryKind: 'team', capacity: 4, admission: 'manual' });
    const admitEntry = vi.fn(() => of(field([entry('North Stars'), entry('Cedar Owls')], { entryKind: 'team', capacity: 4, admission: 'manual' })));
    const { page, button, text, texts, toasts } = await open({ getField: () => of(pending), admitEntry });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('1 of 4 teams'));
    expect(texts('.summary .help')[0]).toBe('Manual admission · 1 pending your decision');

    expect(button('Add team')).toBeTruthy();
    expect(text('ol li .help')).toContain('Admission pending');
    page().querySelector<HTMLButtonElement>('ol button')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 4 teams'));
    expect(admitEntry).toHaveBeenCalledWith(organisation, tournamentId, 'e-Cedar-Owls', { expectedRevision: 1, reason: null });
    // In order: no confirmation, and the outcome is a toast.
    expect(toasts()).toEqual(['Cedar Owls admitted.']);
  });

  it('keeps admission available after closure while adding says to reopen registration', async () => {
    const closed = field([entry('Robin Vale'), waiting('Ellis Stone', 1)], { registration: 'closed' });
    const { page, button, text } = await open({ getField: () => of(closed) }, tournament({ registration: 'closed' }));
    await vi.waitFor(() => expect(button('Add player')?.disabled).toBe(true));
    expect(text('#add-reason')).toBe('Registration is closed. Reopen registration in configuration to add entries.');
    expect(page().querySelector<HTMLButtonElement>('ol button')!.disabled).toBe(false);
  });

  it('finds an existing guest by name, tells same-name guests apart by creation, and enters the chosen one', async () => {
    const findGuests = vi.fn(() => of([{ id: 'g-quinn', kind: 'player', name: 'Quinn Ash', createdAt: '2026-11-10T09:00:00Z' }]));
    const enterGuest = vi.fn(() => of(field([entry('Robin Vale'), entry('Quinn Ash', { id: 'x' })])));
    const { button, type, text, settle, dialog, heading } = await open({ getField: () => of(field([entry('Robin Vale')])), findGuests, enterGuest });
    await vi.waitFor(() => expect(button('Add player')).toBeTruthy());

    button('Add player')!.click();
    await settle();
    expect(document.querySelector('herald-drawer')).not.toBeNull();
    expect(heading()).toBe('Add player');
    await vi.waitFor(() => expect(dialog()!.contains(document.activeElement)).toBe(true));
    expect(button('Choose existing')?.getAttribute('aria-pressed')).toBe('true');
    type('#guest-name', 'Qui');
    await vi.waitFor(() => expect(text('.guests h3')).toBe('Quinn Ash'));
    expect(findGuests).toHaveBeenCalledWith(organisation, { kind: 'player', name: 'Qui' });
    expect(text('.guests .help')).toBe('Existing player · created 10 November 2026');
    expect(await violations(document.querySelector('herald-drawer')!)).toEqual([]);

    button('Enter this player')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 2 individual entries'));
    const [, , entryId, body] = enterGuest.mock.calls[0] as unknown as [string, string, string, object];
    expect(body).toEqual({ guestId: 'g-quinn' });
    expect(entryId).toMatch(/^[0-9a-f-]{36}$/);
    await vi.waitFor(() => expect(dialog()).toBeNull());
  });

  it('marks a guest already in the field instead of offering to enter it again', async () => {
    const findGuests = () => of([{ id: 'g-Robin Vale', kind: 'player', name: 'Robin Vale', createdAt: '2026-11-10T09:00:00Z' }]);
    const { button, type, text, settle } = await open({ getField: () => of(field([entry('Robin Vale')])), findGuests });
    await vi.waitFor(() => expect(button('Add player')).toBeTruthy());
    button('Add player')!.click();
    await settle();
    type('#guest-name', 'Rob');
    await vi.waitFor(() => expect(text('.guests li')).toContain('Already entered in this tournament'));
    expect(button('Enter this player')).toBeUndefined();
  });

  it('creates a new guest and enters it', async () => {
    const createGuest = vi.fn(() => of({ id: 'g-new', kind: 'player', name: 'Reese Moss', createdAt: '2026-11-11T09:00:00Z' }));
    const enterGuest = vi.fn(() => of(field([entry('Reese Moss')])));
    const { button, type, text, settle } = await open({ getField: () => of(field([])), createGuest, enterGuest });
    await vi.waitFor(() => expect(button('Add player')).toBeTruthy());
    button('Add player')!.click();
    await settle();
    button('Create new')!.click();
    await settle();
    expect(text('label[for="guest-name"]')).toBe('Name (alias)');
    type('#guest-name', '  Reese Moss ');
    button('Create and enter player')!.click();

    await vi.waitFor(() => expect(text('#summary-heading')).toBe('1 of 2 individual entries'));
    expect(createGuest).toHaveBeenCalledWith(organisation, expect.any(String), { kind: 'player', name: 'Reese Moss', confirmNew: false });
    expect(enterGuest).toHaveBeenCalledWith(organisation, tournamentId, expect.any(String), { guestId: 'g-new' });
  });

  it('lists a possible duplicate, offers to enter it, and creates a new guest anyway with the same identifier', async () => {
    const match = { id: 'g-quinn', kind: 'player', name: 'Quinn Ash', createdAt: '2026-11-10T09:00:00Z' };
    const createGuest = answers(
      () => throwError(() => problem(409, { type: 'possible-duplicate', title: 'Conflict', status: 409, matches: [match] })),
      () => of({ ...match, id: 'g-second' }),
    );
    const { button, type, text, texts, settle } = await open({ getField: () => of(field([])), createGuest, enterGuest: () => of(field([entry('Quinn Ash')])) });
    await vi.waitFor(() => expect(button('Add player')).toBeTruthy());
    button('Add player')!.click();
    await settle();
    button('Create new')!.click();
    await settle();
    type('#guest-name', 'quinn ash');
    button('Create and enter player')!.click();

    await vi.waitFor(() => expect(texts('herald-notice strong')).toContain('Possible duplicate'));
    expect(text('.guests h3')).toBe('Quinn Ash');
    expect(button('Enter this player')).toBeTruthy();
    expect(button('Create and enter player')).toBeUndefined();
    expect(await violations(document.querySelector('herald-drawer')!)).toEqual([]);

    button('Create a new player anyway')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('1 of 2 individual entries'));
    const calls = createGuest.mock.calls as unknown as [string, string, { confirmNew: boolean }][];
    expect(calls[1][1]).toBe(calls[0][1]);
    expect(calls[1][2].confirmNew).toBe(true);
  });

  it('prevents a repeated add while one is in progress', async () => {
    const pending = new Subject<never>();
    const createGuest = vi.fn(() => pending);
    const { button, type, text, settle } = await open({ getField: () => of(field([])), createGuest });
    await vi.waitFor(() => expect(button('Add player')).toBeTruthy());
    button('Add player')!.click();
    await settle();
    button('Create new')!.click();
    await settle();
    type('#guest-name', 'Reese Moss');
    button('Create and enter player')!.click();

    await vi.waitFor(() => expect(text('[role=dialog] [role="status"]')).toBe('Adding entry. Please wait; do not submit again.'));
    expect(text('[role=dialog]')).toBeTruthy();
    expect(document.querySelector('[role=dialog]')!.getAttribute('aria-busy')).toBe('true');
    expect(button('Add player')?.disabled).toBe(true);
    expect(text('#add-reason')).toBe('Request in progress. Please wait; do not submit again.');
    button('Adding…')!.click();
    expect(createGuest).toHaveBeenCalledTimes(1);
  });

  it('says a failed add changed nothing, keeps the input, and retries with the same identifiers', async () => {
    const createGuest = vi.fn(() => of({ id: 'g-new', kind: 'player', name: 'Reese Moss', createdAt: '2026-11-11T09:00:00Z' }));
    const enterGuest = answers(() => throwError(() => problem(500)), () => of(field([entry('Reese Moss')])));
    const { page, button, type, text, settle } = await open({ getField: () => of(field([])), createGuest, enterGuest });
    await vi.waitFor(() => expect(button('Add player')).toBeTruthy());
    button('Add player')!.click();
    await settle();
    button('Create new')!.click();
    await settle();
    type('#guest-name', 'Reese Moss');
    button('Create and enter player')!.click();

    // The drawer stays open with the input and explains the failure inside it.
    await vi.waitFor(() => expect(text('[role=dialog] herald-notice strong')).toBe('Entry was not added'));
    expect(text('[role=dialog] herald-notice')).toContain('Nothing was added. Your input is kept; try again.');
    expect(document.querySelector<HTMLInputElement>('#guest-name')!.value).toBe('Reese Moss');
    expect(page().querySelector('herald-notice')).toBeNull();

    button('Retry add')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('1 of 2 individual entries'));
    const guestIds = (createGuest.mock.calls as unknown as [string, string][]).map((c) => c[1]);
    const entryIds = (enterGuest.mock.calls as unknown as [string, string, string][]).map((c) => c[2]);
    expect(new Set(guestIds).size).toBe(1);
    expect(new Set(entryIds).size).toBe(1);
  });

  it('asks for a private reason before admitting ahead of the capacity queue', async () => {
    const closed = field([entry('Robin Vale'), waiting('Ellis Stone', 1), waiting('Rowan Lake', 2)], { registration: 'closed' });
    const admitEntry = vi.fn(() => of(field([entry('Robin Vale'), entry('Rowan Lake'), waiting('Ellis Stone', 1)], { registration: 'closed' })));
    const { page, button, type, text, settle, heading } = await open({ getField: () => of(closed), admitEntry }, tournament({ registration: 'closed' }));
    await vi.waitFor(() => expect(page().querySelectorAll('ol li')).toHaveLength(2));

    page().querySelectorAll<HTMLButtonElement>('ol button')[2].click();
    await settle();
    expect(heading()).toBe('Admit Rowan Lake ahead of Ellis Stone?');
    expect(text('[role=dialog] .herald-dialog-body > p')).toContain('Registration is closed, so no entry is admitted automatically.');
    expect(button('Admit Rowan Lake')?.disabled).toBe(true);
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('admit-reason'));
    expect(await violations(document.querySelector('herald-dialog')!)).toEqual([]);

    type('#admit-reason', '  Organiser seed  ');
    await settle();
    button('Admit Rowan Lake')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 2 individual entries'));
    expect(admitEntry).toHaveBeenCalledWith(organisation, tournamentId, 'e-Rowan-Lake', { expectedRevision: 1, reason: 'Organiser seed' });
  });

  it('names the waiting entry a cancellation will admit, and shows it admitted after confirming', async () => {
    const promoted = field([entry('Sam Reed'), entry('Ellis Stone'), cancelled('Robin Vale')]);
    const cancelEntry = vi.fn(() => of(promoted));
    const { page, button, text, texts, settle, heading, toasts } = await open({ getField: () => of(full()), cancelEntry });
    await vi.waitFor(() => expect(page().querySelectorAll('ul[aria-labelledby="admitted-heading"] li')).toHaveLength(2));

    const trigger = page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button')!;
    trigger.click();
    await settle();
    expect(heading()).toBe('Cancel Robin Vale’s entry?');
    expect(text('[role=dialog] herald-notice')).toContain('Ellis Stone, first in the capacity queue, will be admitted automatically.');
    expect(button('Confirm cancellation')?.getAttribute('data-variant')).toBe('destructive');
    await vi.waitFor(() => expect(document.activeElement).toBe(button('Keep entry')));
    expect(await violations(document.querySelector('herald-dialog')!)).toEqual([]);

    button('Keep entry')!.click();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    trigger.click();
    await settle();
    button('Confirm cancellation')!.click();
    await vi.waitFor(() => expect(text('ol')).toBeUndefined());
    expect(cancelEntry).toHaveBeenCalledWith(organisation, tournamentId, 'e-Robin-Vale', { expectedRevision: 1 });
    expect(text('ul[aria-labelledby="admitted-heading"]')).toContain('Ellis Stone');
    expect(toasts()).toEqual(['Robin Vale’s entry cancelled.']);
    // History is a compact group, collapsed by default, after the summary.
    const history = page().querySelector<HTMLDetailsElement>('details.cancelled')!;
    expect(history.open).toBe(false);
    expect(text('details.cancelled summary')).toBe('Cancelled · 1');
    expect(texts('details.cancelled li')).toEqual(['Robin Vale · Cancelled 11 November 2026, 09:45 · Europe/Madrid']);
    expect(page().querySelector('details.cancelled button')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('summary-heading'));
  });

  it('keeps the cancellation dialog open and unrepeatable while its request is in progress, then explains a failure inside it', async () => {
    const pending = new Subject<FieldDetails>();
    const cancelEntry = answers(() => pending, () => of(field([entry('Sam Reed'), entry('Ellis Stone'), cancelled('Robin Vale')])));
    const { page, button, text, settle, dialog, toasts } = await open({ getField: () => of(full()), cancelEntry });
    await vi.waitFor(() => expect(page().querySelectorAll('ul[aria-labelledby="admitted-heading"] li')).toHaveLength(2));
    page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button')!.click();
    await settle();
    button('Confirm cancellation')!.click();
    await settle();

    expect(dialog()!.getAttribute('aria-busy')).toBe('true');
    expect(button('Keep entry')!.disabled).toBe(true);
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    button('Cancelling…')!.click();
    await settle();
    expect(dialog()).not.toBeNull();
    expect(cancelEntry).toHaveBeenCalledTimes(1);

    pending.error(problem(500));
    await vi.waitFor(() => expect(text('[role=dialog] herald-notice[data-tone=danger] strong')).toBe('Entry was not cancelled'));
    expect(toasts()).toEqual([]);
    button('Try again')!.click();
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(toasts()).toEqual(['Robin Vale’s entry cancelled.']);
  });

  it('says no waiting entry is admitted automatically when cancelling after closure', async () => {
    const closed = field([entry('Robin Vale'), entry('Sam Reed'), waiting('Ellis Stone', 1)], { registration: 'closed' });
    const { page, text, settle } = await open({ getField: () => of(closed) }, tournament({ registration: 'closed' }));
    await vi.waitFor(() => expect(page().querySelectorAll('ul[aria-labelledby="admitted-heading"] li')).toHaveLength(2));
    page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button')!.click();
    await settle();
    expect(text('[role=dialog] herald-notice')).toContain('No waiting entry will be admitted automatically because registration is closed.');
  });

  it('says an entry changed elsewhere and reloads the latest field', async () => {
    const getField = answers(() => of(full()), () => of(field([entry('Sam Reed'), waiting('Ellis Stone', 1)])));
    const cancelEntry = () => throwError(() => problem(409, { type: 'entry-revision-conflict', currentRevision: 2 }));
    const { page, button, text, texts, settle } = await open({ getField, cancelEntry });
    await vi.waitFor(() => expect(page().querySelectorAll('ul[aria-labelledby="admitted-heading"] li')).toHaveLength(2));
    page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button')!.click();
    await settle();
    button('Confirm cancellation')!.click();

    await vi.waitFor(() => expect(texts('herald-notice strong')).toContain('This entry changed elsewhere'));
    // A conflict is a persistent notice on the page, not inside the dialog, which closes.
    await vi.waitFor(() => expect(document.querySelector('[role=dialog]')).toBeNull());
    expect(page().textContent).toContain('This entry changed elsewhere');
    expect(text('#add-reason')).toBe('Reload the latest version first.');
    button('Reload latest')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('1 of 2 individual entries'));
    expect(texts('herald-notice strong')).not.toContain('This entry changed elsewhere');
  });

  it('reports admitted entries over capacity and blocks adding and admitting, not cancelling', async () => {
    const over = field([entry('Robin Vale'), entry('Sam Reed'), entry('Jamie Brook'), waiting('Ellis Stone', 1)], {}, { overCapacityBy: 1 });
    const { page, button, text, texts } = await open({ getField: () => of(over) });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('3 of 2 individual entries'));
    expect(texts('herald-notice strong')).toContain('Field is over capacity');
    expect(button('Add player')?.disabled).toBe(true);
    expect(text('#add-reason')).toBe('Field is over capacity. Cancel an admitted entry before adding or admitting.');
    expect(text('ol li p:last-of-type')).toBe('Field is over capacity. Cancel an admitted entry first.');
    expect(page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button')!.disabled).toBe(false);
  });

  it('says it is loading the field without counts or rows', async () => {
    const { page, text } = await open({ getField: () => new Subject() });
    await vi.waitFor(() => expect(text('.operation h2')).toBe('Loading entries…'));
    expect(page().querySelector('#summary-heading')).toBeNull();
    expect(page().querySelectorAll('li')).toHaveLength(0);
  });

  it('explains a failed load without rows and loads on retry', async () => {
    const getField = answers(() => throwError(() => problem(500)), () => of(full()));
    const { page, button, text } = await open({ getField });
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('Entries could not be loaded'));
    expect(page().querySelectorAll('li')).toHaveLength(0);
    expect(await violations(page())).toEqual([]);
    button('Try again')!.click();
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 2 individual entries'));
  });

  it('has no entries page for a draft', async () => {
    const getField = vi.fn();
    const { text } = await open({ getField }, tournament({ publication: 'draft', registration: 'notOpen' }));
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('Entries not available'));
    expect(getField).not.toHaveBeenCalled();
  });
});
