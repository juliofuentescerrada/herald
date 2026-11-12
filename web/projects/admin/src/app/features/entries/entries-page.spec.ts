import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EntryDetails, FieldDetails, HeraldHostAdminService, RosterDetails, RosterMemberDetails, RosterReadiness, TournamentDetails } from '@herald/api-client/admin';
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
  checkedInEntries: 0,
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
  checkedIn: 0,
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

  it('shows the entries icon above the empty field’s heading', { meta: { type: 'covers', description: 'interface-icons: An empty field carries its icon' } }, async () => {
    const { page, text } = await open({ getField: () => of(field([])) });
    await vi.waitFor(() => expect(text('#empty-heading')).toBe('No entries yet'));
    const icon = page().querySelector('#empty-heading')?.previousElementSibling;
    expect(icon?.getAttribute('data-icon')).toBe('users');
    expect(icon?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows an empty open field with adding a player as its one primary action', async () => {
    const { page, text, texts } = await open({ getField: () => of(field([])) });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('0 of 2 individual entries'));

    expect(text('h1')).toBe('Entries · Saturday Open');
    expect(texts('herald-status-label')).toEqual(['Published', 'Registration open', 'Preparing']);
    expect(texts('.summary .help')).toEqual(['Automatic admission · 0 waiting for a slot', 'Check-in optional', 'Entry terms updated 11 November 2026, 10:10 · Europe/Madrid']);
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
    page().querySelector<HTMLButtonElement>('[aria-label="Admit: Cedar Owls"]')!.click();
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

    const trigger = page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button[aria-label^="Cancel entry"]')!;
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
    page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button[aria-label^="Cancel entry"]')!.click();
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
    page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button[aria-label^="Cancel entry"]')!.click();
    await settle();
    expect(text('[role=dialog] herald-notice')).toContain('No waiting entry will be admitted automatically because registration is closed.');
  });

  it('says an entry changed elsewhere and reloads the latest field', async () => {
    const getField = answers(() => of(full()), () => of(field([entry('Sam Reed'), waiting('Ellis Stone', 1)])));
    const cancelEntry = () => throwError(() => problem(409, { type: 'entry-revision-conflict', currentRevision: 2 }));
    const { page, button, text, texts, settle } = await open({ getField, cancelEntry });
    await vi.waitFor(() => expect(page().querySelectorAll('ul[aria-labelledby="admitted-heading"] li')).toHaveLength(2));
    page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button[aria-label^="Cancel entry"]')!.click();
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
    expect(page().querySelector<HTMLButtonElement>('ul[aria-labelledby="admitted-heading"] button[aria-label^="Cancel entry"]')!.disabled).toBe(false);
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

describe('The roster of a team entry', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.querySelectorAll('herald-dialog, herald-drawer').forEach((element) => element.remove());
  });

  const bounds = { entryKind: 'team' as const, capacity: 4, minimumRosterSize: 3, maximumRosterSize: 5 };
  const team = (name: string, size: number, rosterReadiness: RosterReadiness, over: Partial<EntryDetails> = {}) =>
    entry(name, { rosterSize: size, rosterRevision: size, rosterReadiness, ...over });
  const teams = (entries: EntryDetails[], terms: Partial<FieldDetails['terms']> = {}) => field(entries, { ...bounds, ...terms });

  const member = (name: string, minute: number, over: Partial<RosterMemberDetails> = {}): RosterMemberDetails => ({
    guestId: `p-${name}`,
    name,
    addedAt: `2026-11-11T17:${String(minute).padStart(2, '0')}:00Z`,
    possibleDuplicateOf: null,
    ...over,
  });
  const players = ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch', 'Casey Wood', 'Parker Snow'];
  const roster = (size: number, over: Partial<RosterDetails> = {}): RosterDetails => {
    const members = players.slice(0, size).map((name, index) => member(name, 20 + index * 2));
    const readiness: RosterReadiness = size < 3 ? 'incomplete' : size > 5 ? 'aboveMaximum' : 'complete';
    return {
      entryId: 'e-River-Falcons',
      teamName: 'River Falcons',
      entryState: 'admitted',
      revision: size,
      minimumRosterSize: 3,
      maximumRosterSize: 5,
      readiness,
      members,
      history: members.map((m, index) => ({ rosterRevision: index + 1, guestId: m.guestId, name: m.name, kind: 'added' as const, changedBy: 'p-owner', changedAt: m.addedAt })),
      ...over,
    };
  };

  const page = (getRoster: unknown, more: Record<string, unknown> = {}, entries = [team('Team A', 4, 'complete'), team('River Falcons', 2, 'incomplete')]) =>
    open(
      { getField: () => of(teams(entries)), getRoster, getMe: () => of({ displayName: 'Alex Morgan', organisations: [] }), ...more },
      tournament({ configuration: { ...tournament().configuration, title: 'Saturday Team League', entryKind: 'team', capacity: 4 } }),
    );

  /** Opens the roster of the named team from its row. */
  const openRoster = async (harness: Awaited<ReturnType<typeof open>>, name = 'River Falcons') => {
    await vi.waitFor(() => expect(document.querySelector(`[aria-label="Roster: ${name}"]`)).not.toBeNull());
    document.querySelector<HTMLButtonElement>(`[aria-label="Roster: ${name}"]`)!.click();
    await harness.settle();
  };

  it('shows each team’s roster readiness in words beside its name, waiting and cancelled teams included', async () => {
    const entries = [
      team('Team A', 4, 'complete'),
      team('River Falcons', 2, 'incomplete'),
      team('Cedar Owls', 6, 'aboveMaximum'),
      team('Meadow Foxes', 4, 'complete', { state: 'waiting', waitingReason: 'admissionPending', position: 1, waitingSince: '2026-11-11T17:00:00Z', admittedAt: null }),
      team('Pine Hawks', 1, 'incomplete', { state: 'cancelled', cancelledAt: '2026-11-11T16:00:00Z', admittedAt: null }),
    ];
    const harness = await page(() => of(roster(2)), {}, entries);
    await vi.waitFor(() => expect(harness.texts('.readiness')).toHaveLength(4));

    expect(harness.texts('.readiness')).toEqual(['4 of 3–5 players', '2 of 3–5 players · incomplete', '6 of 3–5 players · above maximum', '4 of 3–5 players']);
    expect(document.querySelectorAll('.readiness.readiness-warning')).toHaveLength(2);
    expect(document.querySelectorAll('[aria-label^="Roster: "]')).toHaveLength(5);
    expect(await violations(harness.page())).toEqual([]);
  });

  it('shows no roster in an individual tournament', async () => {
    const { text, page: root } = await open({ getField: () => of(full()) });
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 2 individual entries'));
    expect(root().querySelector('.readiness')).toBeNull();
    expect(root().querySelector('[aria-label^="Roster: "]')).toBeNull();
  });

  it('lists the members in the order added, with the bounds and the readiness', async () => {
    const harness = await page(() => of(roster(2)));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.texts('.members .member-name')).toEqual(['Robin Vale', 'Sam Reed']));

    expect(harness.heading()).toBe('Roster · River Falcons');
    expect(harness.texts('.roster-facts p')).toEqual(['3 to 5 players', '2 of 3–5 players · incomplete']);
    expect(harness.texts('.members .small')).toEqual(['Added 11 November 2026, 18:20', 'Added 11 November 2026, 18:22']);
    expect(harness.text('.history summary')).toBe('History · 2');
    expect(document.querySelector('details.history')!.hasAttribute('open')).toBe(false);
    expect(harness.button('Add player')?.disabled).toBe(false);
    await vi.waitFor(() => expect(harness.dialog()!.contains(document.activeElement)).toBe(true));
    expect(await violations(document.querySelector('herald-drawer')!)).toEqual([]);
  });

  it('shows an empty roster with adding available', async () => {
    const harness = await page(() => of(roster(0, { history: [] })));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.text('.members-heading')).toBe('Members · 0'));
    expect(harness.texts('[role=dialog] .help')).toContain('No players yet.');
    expect(harness.button('Add player')?.disabled).toBe(false);
  });

  it('shows a complete roster in neutral words with adding still available', async () => {
    const harness = await page(() => of(roster(4)));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.texts('.roster-facts p')).toEqual(['3 to 5 players', '4 of 3–5 players']));
    expect(document.querySelector('.roster-facts .readiness-warning')).toBeNull();
    expect(harness.button('Add player')?.disabled).toBe(false);
  });

  it('says a full roster takes no one else until a member is removed', async () => {
    const harness = await page(() => of(roster(5)));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.button('Add player')?.disabled).toBe(true));
    expect(harness.text('#roster-add-reason')).toBe('The roster has 5 players, the maximum. Remove a member before adding another player.');
  });

  it('keeps every member above a lowered maximum and says how many to remove', async () => {
    const harness = await page(() => of(roster(6, { maximumRosterSize: 5 })));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.texts('.members .member-name')).toHaveLength(6));
    expect(harness.text('.roster-facts .readiness-warning')).toBe('6 of 3–5 players · above maximum');
    expect(harness.text('#roster-add-reason')).toBe('The roster has 6 players, above the maximum of 5. Remove 2 members before adding another player.');
  });

  it('finds players, marks one on another team as unavailable, and adds another without a toast', async () => {
    const findGuests = vi.fn(() =>
      of([
        { id: 'p-reese', kind: 'player', name: 'Reese Moss', createdAt: '2026-11-10T09:00:00Z', team: null },
        { id: 'p-rowan', kind: 'player', name: 'Rowan Lake', createdAt: '2026-11-10T09:00:00Z', team: { entryId: 'e-Team-A', name: 'Team A' } },
      ]),
    );
    const added = roster(2);
    const addRosterMember = vi.fn(() => of({ ...added, revision: 3, members: [...added.members, member('Reese Moss', 30, { guestId: 'p-reese' })] }));
    const getField = vi.fn(() => of(teams([team('Team A', 4, 'complete'), team('River Falcons', 2, 'incomplete')])));
    const harness = await page(() => of(roster(2)), { findGuests, addRosterMember, getField });
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.button('Add player')).toBeTruthy());

    harness.button('Add player')!.click();
    await harness.settle();
    harness.type('#player-name', 'R');
    await vi.waitFor(() => expect(harness.texts('.guests h3')).toEqual(['Reese Moss', 'Rowan Lake']));
    expect(findGuests).toHaveBeenCalledWith(organisation, { kind: 'player', name: 'R', tournamentId });
    expect(harness.texts('.guests li')[1]).toContain('On Team A');
    expect(document.querySelector('[aria-label="Add player: Rowan Lake"]')).toBeNull();
    expect(await violations(document.querySelector('herald-drawer')!)).toEqual([]);

    document.querySelector<HTMLButtonElement>('[aria-label="Add player: Reese Moss"]')!.click();
    await vi.waitFor(() => expect(harness.texts('.members .member-name')).toEqual(['Robin Vale', 'Sam Reed', 'Reese Moss']));
    expect(addRosterMember).toHaveBeenCalledWith(organisation, tournamentId, 'e-River-Falcons', 'p-reese', { expectedRevision: 2 });
    expect(harness.toasts()).toEqual([]);
    expect(harness.dialog()).not.toBeNull();
    await vi.waitFor(() => expect(getField).toHaveBeenCalledTimes(2));
  });

  it('creates a new player, warns of a possible duplicate, and adds one anyway', async () => {
    const match = { id: 'p-ana', kind: 'player', name: 'Ana Ruiz', createdAt: '2026-11-10T09:00:00Z' };
    const createGuest = answers(
      () => throwError(() => problem(409, { type: 'possible-duplicate', title: 'Conflict', status: 409, matches: [match] })),
      () => of({ ...match, id: 'p-ana-2' }),
    );
    const addRosterMember = vi.fn(() => of(roster(3)));
    const harness = await page(() => of(roster(2)), { createGuest, addRosterMember });
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.button('Add player')).toBeTruthy());
    harness.button('Add player')!.click();
    await harness.settle();
    harness.button('Create new')!.click();
    await harness.settle();
    harness.type('#player-name', 'ana ruiz');
    harness.button('Create and add player')!.click();

    await vi.waitFor(() => expect(harness.texts('herald-notice strong')).toContain('Possible duplicate'));
    expect(harness.text('.guests h3')).toBe('Ana Ruiz');
    expect(await violations(document.querySelector('herald-drawer')!)).toEqual([]);
    harness.button('Create a new player anyway')!.click();
    await vi.waitFor(() => expect(addRosterMember).toHaveBeenCalledWith(organisation, tournamentId, 'e-River-Falcons', 'p-ana-2', { expectedRevision: 2 }));
    const calls = createGuest.mock.calls as unknown as [string, string, { kind: string; confirmNew: boolean }][];
    expect(calls[1][1]).toBe(calls[0][1]);
    expect(calls[1][2]).toEqual({ kind: 'player', name: 'ana ruiz', confirmNew: true });
  });

  it('prevents a repeated addition while one is in progress', async () => {
    const pending = new Subject<never>();
    const createGuest = vi.fn(() => pending);
    const harness = await page(() => of(roster(2)), { createGuest });
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.button('Add player')).toBeTruthy());
    harness.button('Add player')!.click();
    await harness.settle();
    harness.button('Create new')!.click();
    await harness.settle();
    harness.type('#player-name', 'Reese Moss');
    harness.button('Create and add player')!.click();

    await vi.waitFor(() => expect(harness.text('[role=dialog] form [role="status"]')).toBe('Adding the player. Please wait; do not submit again.'));
    expect(harness.dialog()!.getAttribute('aria-busy')).toBe('true');
    expect(harness.button('Back to entries')?.disabled).toBe(true);
    harness.button('Adding…')!.click();
    expect(createGuest).toHaveBeenCalledTimes(1);
  });

  it('says a failed addition added nothing, keeps the input, and retries', async () => {
    const createGuest = vi.fn(() => of({ id: 'p-new', kind: 'player', name: 'Reese Moss', createdAt: '2026-11-11T09:00:00Z' }));
    const addRosterMember = answers(() => throwError(() => problem(500)), () => of(roster(3)));
    const harness = await page(() => of(roster(2)), { createGuest, addRosterMember });
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.button('Add player')).toBeTruthy());
    harness.button('Add player')!.click();
    await harness.settle();
    harness.button('Create new')!.click();
    await harness.settle();
    harness.type('#player-name', 'Reese Moss');
    harness.button('Create and add player')!.click();

    await vi.waitFor(() => expect(harness.text('form herald-notice')).toContain('The request failed. Nothing was added. Your input is kept; try again.'));
    expect(document.querySelector<HTMLInputElement>('#player-name')!.value).toBe('Reese Moss');
    harness.button('Retry add')!.click();
    await vi.waitFor(() => expect(addRosterMember).toHaveBeenCalledTimes(2));
    const calls = createGuest.mock.calls as unknown as [string, string][];
    expect(calls[1][1]).toBe(calls[0][1]);
  });

  it('says which team holds a player the API refused', async () => {
    const match = { id: 'p-ana', kind: 'player', name: 'Ana Ruiz', createdAt: '2026-11-10T09:00:00Z', team: null };
    const addRosterMember = vi.fn(() =>
      throwError(() => problem(400, { errors: { guestId: ['on-another-team'] }, team: { entryId: 'e-Team-A', name: 'Team A' } })),
    );
    const harness = await page(() => of(roster(2)), { findGuests: () => of([match]), addRosterMember });
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.button('Add player')).toBeTruthy());
    harness.button('Add player')!.click();
    await harness.settle();
    harness.type('#player-name', 'Ana');
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Add player: Ana Ruiz"]')).not.toBeNull());
    document.querySelector<HTMLButtonElement>('[aria-label="Add player: Ana Ruiz"]')!.click();
    await vi.waitFor(() => expect(harness.text('form herald-notice')).toContain('This player is on Team A’s roster in this tournament. Nothing changed.'));
  });

  it('removes a member with no confirmation, unrepeatable while in progress', async () => {
    const pending = new Subject<RosterDetails>();
    const removeRosterMember = vi.fn(() => pending);
    const harness = await page(() => of(roster(3)), { removeRosterMember });
    await openRoster(harness);
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Remove: Robin Vale"]')).not.toBeNull());

    document.querySelector<HTMLButtonElement>('[aria-label="Remove: Robin Vale"]')!.click();
    await vi.waitFor(() => expect(harness.text('[aria-label="Remove: Robin Vale"]')).toBe('Removing…'));
    expect(harness.text('[role=dialog] [role="status"]')).toBe('Removing the player. Please wait; do not submit again.');
    expect(document.querySelector<HTMLButtonElement>('[aria-label="Remove: Sam Reed"]')!.disabled).toBe(true);
    expect(harness.button('Back to entries')?.disabled).toBe(true);
    // One status says why: adding is unavailable without a second, repeated reason.
    expect(harness.button('Add player')?.disabled).toBe(true);
    expect(document.querySelector('#roster-add-reason')).toBeNull();
    expect(removeRosterMember).toHaveBeenCalledWith(organisation, tournamentId, 'e-River-Falcons', 'p-Robin Vale', { expectedRevision: 3 });

    const after = roster(3);
    pending.next({ ...after, revision: 4, readiness: 'incomplete', members: after.members.slice(1) });
    pending.complete();
    await vi.waitFor(() => expect(harness.texts('.members .member-name')).toEqual(['Sam Reed', 'Jamie Brook']));
    expect(harness.toasts()).toEqual([]);
  });

  it('flags a member who may be the same person as a player on another team', async () => {
    const flagged = roster(2);
    flagged.members[1] = { ...flagged.members[1], possibleDuplicateOf: { entryId: 'e-Team-A', name: 'Team A' } };
    const harness = await page(() => of(flagged));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.text('.member-flag')).toContain('Possible duplicate of a player on Team A.'));
    expect(document.querySelector('[aria-label="Remove: Sam Reed"]')).not.toBeNull();
  });

  it('lists additions and removals in the history with who and when', async () => {
    const history = roster(1, {
      history: [
        { rosterRevision: 1, guestId: 'p-parker', name: 'Parker Snow', kind: 'added', changedBy: 'p-owner', changedAt: '2026-11-11T17:10:00Z' },
        { rosterRevision: 2, guestId: 'p-parker', name: 'Parker Snow', kind: 'removed', changedBy: 'p-owner', changedAt: '2026-11-11T17:15:00Z' },
        { rosterRevision: 3, guestId: 'p-Robin Vale', name: 'Robin Vale', kind: 'added', changedBy: 'p-owner', changedAt: '2026-11-11T17:20:00Z' },
      ],
    });
    const harness = await page(() => of(history));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.text('.history summary')).toBe('History · 3'));
    document.querySelector<HTMLElement>('.history summary')!.click();

    expect(harness.texts('.history li')).toEqual([
      'Added Parker Snow Alex Morgan · 11 November 2026, 18:10 · Europe/Madrid',
      'Removed Parker Snow Alex Morgan · 11 November 2026, 18:15 · Europe/Madrid',
      'Added Robin Vale Alex Morgan · 11 November 2026, 18:20 · Europe/Madrid',
    ]);
  });

  it('shows a cancelled team’s roster read only', async () => {
    const harness = await page(() => of(roster(2, { entryState: 'cancelled' })));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.texts('herald-notice strong')).toContain('Read only'));
    expect(harness.texts('.help')).toContain('Cancelled team · Saturday Team League');
    expect(document.querySelector('[aria-label^="Remove: "]')).toBeNull();
    expect(harness.button('Add player')).toBeUndefined();
    expect(harness.text('.history summary')).toBe('History · 2');
  });

  it('waits for the tournament’s roster sizes before any roster change', async () => {
    const harness = await page(() => of(roster(2, { minimumRosterSize: null, maximumRosterSize: null, readiness: 'awaitingTerms' })));
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.texts('.roster-facts p')).toEqual(['Roster sizes not available', '2 players · waiting for the tournament’s roster sizes']));
    expect(harness.button('Add player')?.disabled).toBe(true);
    expect(harness.text('#roster-add-reason')).toBe('The tournament’s roster sizes are not known yet. Saving the tournament’s configuration sends them.');
    expect(document.querySelector<HTMLButtonElement>('[aria-label="Remove: Robin Vale"]')!.disabled).toBe(true);
  });

  it('says the roster changed elsewhere, keeps the last list and reloads the latest', async () => {
    const getRoster = answers(() => of(roster(3)), () => of(roster(2, { revision: 4 })));
    const removeRosterMember = vi.fn(() => throwError(() => problem(409, { type: 'roster-revision-conflict', currentRevision: 4 })));
    const harness = await page(getRoster, { removeRosterMember });
    await openRoster(harness);
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Remove: Robin Vale"]')).not.toBeNull());
    document.querySelector<HTMLButtonElement>('[aria-label="Remove: Robin Vale"]')!.click();

    await vi.waitFor(() => expect(harness.texts('herald-notice strong')).toContain('This roster changed elsewhere'));
    expect(harness.texts('.members .member-name')).toHaveLength(3);
    expect(harness.text('#roster-add-reason')).toBe('Reload the latest roster first.');
    harness.button('Reload latest')!.click();
    await vi.waitFor(() => expect(harness.texts('.members .member-name')).toHaveLength(2));
    expect(harness.button('Add player')?.disabled).toBe(false);
  });

  it('says it is loading the roster without members', async () => {
    const harness = await page(() => new Subject<RosterDetails>());
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.text('[role=dialog] [role="status"]')).toBe('Loading roster…'));
    expect(document.querySelector('.members')).toBeNull();
    expect(harness.heading()).toBe('Roster · River Falcons');
  });

  it('explains a failed load without members and loads on retry', async () => {
    const getRoster = answers(() => throwError(() => problem(500)), () => of(roster(2)));
    const harness = await page(getRoster);
    await openRoster(harness);
    await vi.waitFor(() => expect(harness.texts('herald-notice strong')).toContain('Roster could not be loaded'));
    expect(document.querySelector('.members')).toBeNull();
    harness.button('Try again')!.click();
    await vi.waitFor(() => expect(harness.texts('.members .member-name')).toEqual(['Robin Vale', 'Sam Reed']));
  });
});

describe('Check-in on the entries page', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.querySelectorAll('herald-dialog, herald-drawer').forEach((element) => element.remove());
  });

  const pending = (name: string, over: Partial<EntryDetails> = {}) => entry(name, { checkIn: 'pending', checkInRevision: 0, ...over });
  const confirmed = (name: string, at = '2026-11-12T09:42:00Z', over: Partial<EntryDetails> = {}) =>
    entry(name, { checkIn: 'confirmed', checkInRevision: 1, checkInChangedAt: at, ...over });
  const mandatory = tournament({ configuration: { ...tournament().configuration, capacity: 4, checkIn: 'mandatory' } });
  const desk = (...entries: EntryDetails[]) =>
    field(entries, { capacity: 4 }, { checkedIn: entries.filter((e) => e.state === 'admitted' && e.checkIn === 'confirmed').length });
  const row = (page: () => HTMLElement, name: string) =>
    [...page().querySelectorAll<HTMLLIElement>('ul[aria-labelledby="admitted-heading"] li')].find((li) => li.querySelector('h3')?.textContent?.trim() === name)!;
  const action = (page: () => HTMLElement, label: string) => page().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

  it('puts each check-in label’s icon before its text', { meta: { type: 'covers', description: 'interface-icons: Check-in labels carry icons' } }, async () => {
    const { page, text } = await open({ getField: () => of(desk(confirmed('Robin Vale'), pending('Sam Reed'))) }, mandatory);
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 4 individual entries'));
    const labels = [...page().querySelectorAll('ul[aria-labelledby="admitted-heading"] herald-status-label')];
    expect(labels.map((l) => [l.firstElementChild?.getAttribute('data-icon'), l.textContent?.trim()])).toEqual([
      ['circle-check', 'Checked in'],
      ['circle-dashed', 'Check-in pending'],
    ]);
  });

  it('shows each admitted entry’s check-in beside its name, its last confirmation and the count with the policy', async () => {
    const { page, text, texts } = await open({ getField: () => of(desk(confirmed('Robin Vale'), pending('Sam Reed'))) }, mandatory);
    await vi.waitFor(() => expect(text('#summary-heading')).toBe('2 of 4 individual entries'));

    expect(texts('.summary .help')[1]).toBe('Check-in mandatory · 1 of 2 checked in');
    expect(texts('ul[aria-labelledby="admitted-heading"] herald-status-label')).toEqual(['Checked in', 'Check-in pending']);
    expect(row(page, 'Robin Vale').querySelector('herald-status-label')?.getAttribute('data-tone')).toBe('success');
    expect(row(page, 'Sam Reed').querySelector('herald-status-label')?.getAttribute('data-tone')).toBe('neutral');
    expect(row(page, 'Robin Vale').textContent).toContain('Checked in 12 November 2026, 10:42 · Europe/Madrid');
    // The check-in action comes before cancelling.
    expect([...row(page, 'Sam Reed').querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['Check in', 'Cancel entry']);
    expect(action(page, 'Undo check-in: Robin Vale')).toBeTruthy();
    expect(await violations(page())).toEqual([]);
  });

  it('says an optional policy, and the policy without a count while nothing is admitted', { meta: { type: 'covers', description: 'entrant-check-in: Optional check-in is shown as information' } }, async () => {
    const optional = await open({ getField: () => of(desk(pending('Sam Reed'))) });
    await vi.waitFor(() => expect(optional.texts('.summary .help')[1]).toBe('Check-in optional · 0 of 1 checked in'));
    TestBed.resetTestingModule();

    const empty = await open({ getField: () => of(desk()) }, mandatory);
    await vi.waitFor(() => expect(empty.texts('.summary .help')[1]).toBe('Check-in mandatory'));
  });

  it('checks in at once with a toast, keeping the row’s other actions blocked only while in progress', { meta: { type: 'covers', description: 'entrant-check-in: An owner checks in from the entries page' } }, async () => {
    const answer = new Subject<FieldDetails>();
    const checkIn = vi.fn(() => answer);
    const { page, button, toasts, settle } = await open({ getField: () => of(desk(pending('Sam Reed'), pending('Jamie Brook'))), checkIn }, mandatory);
    await vi.waitFor(() => expect(action(page, 'Check in: Jamie Brook')).toBeTruthy());

    action(page, 'Check in: Jamie Brook').click();
    await settle();
    expect(checkIn).toHaveBeenCalledWith(organisation, tournamentId, 'e-Jamie-Brook', { expectedRevision: 0 });
    const working = row(page, 'Jamie Brook');
    expect(working.getAttribute('aria-busy')).toBe('true');
    expect(working.querySelector('button')?.textContent?.trim()).toBe('Checking in…');
    expect(working.querySelector('button')?.getAttribute('aria-busy')).toBe('true');
    expect(action(page, 'Cancel entry: Jamie Brook').disabled).toBe(true);
    expect(working.querySelector('[role=status]')?.textContent).toBe('Checking in. Please wait; do not submit again.');
    // Other rows and adding stay usable.
    expect(action(page, 'Check in: Sam Reed').disabled).toBe(false);
    expect(button('Add player')?.disabled).toBe(false);
    action(page, 'Checking in: Jamie Brook').click();
    expect(checkIn).toHaveBeenCalledTimes(1);

    answer.next(desk(pending('Sam Reed'), confirmed('Jamie Brook')));
    answer.complete();
    await vi.waitFor(() => expect(toasts()).toEqual(['Jamie Brook checked in.']));
    expect(row(page, 'Jamie Brook').querySelector('herald-status-label')?.textContent).toBe('Checked in');
    expect(page().querySelector('.summary .help:nth-of-type(2)')?.textContent).toBe('Check-in mandatory · 1 of 2 checked in');
  });

  it('undoes a check-in with its revision, removing the confirmation time', async () => {
    const undoCheckIn = vi.fn(() => of(desk(pending('Robin Vale', { checkInRevision: 2, checkInChangedAt: '2026-11-12T09:50:00Z' }))));
    const { page, toasts } = await open({ getField: () => of(desk(confirmed('Robin Vale'))), undoCheckIn }, mandatory);
    await vi.waitFor(() => expect(action(page, 'Undo check-in: Robin Vale')).toBeTruthy());

    action(page, 'Undo check-in: Robin Vale').click();

    await vi.waitFor(() => expect(toasts()).toEqual(['Robin Vale’s check-in undone.']));
    expect(undoCheckIn).toHaveBeenCalledWith(organisation, tournamentId, 'e-Robin-Vale', { expectedRevision: 1 });
    expect(row(page, 'Robin Vale').textContent).not.toContain('Checked in 12 November');
    expect(action(page, 'Check in: Robin Vale')).toBeTruthy();
  });

  it('says a failed check-in under its row, with no toast, and retries with the same action', { meta: { type: 'covers', description: 'entrant-check-in: A failed check-in leaves the row unchanged' } }, async () => {
    const checkIn = answers<FieldDetails>(() => throwError(() => problem(500)), () => of(desk(confirmed('Jamie Brook'))));
    const { page, toasts } = await open({ getField: () => of(desk(pending('Jamie Brook'))), checkIn }, mandatory);
    await vi.waitFor(() => expect(action(page, 'Check in: Jamie Brook')).toBeTruthy());

    action(page, 'Check in: Jamie Brook').click();

    await vi.waitFor(() => expect(row(page, 'Jamie Brook').querySelector('.row-error')?.textContent?.trim())
      .toBe('Check-in was not recorded. The request failed. Nothing changed; try “Check in” again.'));
    expect(toasts()).toEqual([]);
    expect(await violations(page())).toEqual([]);
    action(page, 'Check in: Jamie Brook').click();
    await vi.waitFor(() => expect(toasts()).toEqual(['Jamie Brook checked in.']));
    expect(row(page, 'Jamie Brook').querySelector('.row-error')).toBeNull();
  });

  it('says a check-in changed elsewhere, blocks row writes and reloads the latest field', async () => {
    const getField = answers(() => of(desk(pending('Jamie Brook'))), () => of(desk(confirmed('Jamie Brook'))));
    const checkIn = () => throwError(() => problem(409, { type: 'check-in-revision-conflict', currentRevision: 1 }));
    const { page, button, texts } = await open({ getField, checkIn }, mandatory);
    await vi.waitFor(() => expect(action(page, 'Check in: Jamie Brook')).toBeTruthy());

    action(page, 'Check in: Jamie Brook').click();

    await vi.waitFor(() => expect(texts('herald-notice strong')).toContain('This entry changed elsewhere'));
    expect(action(page, 'Check in: Jamie Brook').disabled).toBe(true);
    expect(action(page, 'Cancel entry: Jamie Brook').disabled).toBe(true);
    button('Reload latest')!.click();
    await vi.waitFor(() => expect(action(page, 'Undo check-in: Jamie Brook')?.disabled).toBe(false));
    expect(texts('herald-notice strong')).not.toContain('This entry changed elsewhere');
  });

  it('reports a rule the API applied and brings the field up to date', async () => {
    const getField = answers(() => of(desk(pending('Jamie Brook'))), () => of(desk()));
    const checkIn = () => throwError(() => problem(400, { errors: { entry: ['cancelled'] } }));
    const { page, text } = await open({ getField, checkIn }, mandatory);
    await vi.waitFor(() => expect(action(page, 'Check in: Jamie Brook')).toBeTruthy());

    action(page, 'Check in: Jamie Brook').click();

    await vi.waitFor(() => expect(text('#summary-heading')).toBe('0 of 4 individual entries'));
    expect(getField).toHaveBeenCalledTimes(2);
  });

  it('keeps a cancelled entry’s last confirmation read-only and out of the count', async () => {
    const parker = confirmed('Parker Snow', '2026-11-12T09:35:00Z', { state: 'cancelled', cancelledAt: '2026-11-12T09:50:00Z' });
    const { page, text, texts } = await open({ getField: () => of(desk(confirmed('Robin Vale'), pending('Sam Reed'), parker)) }, mandatory);
    await vi.waitFor(() => expect(texts('.summary .help')[1]).toBe('Check-in mandatory · 1 of 2 checked in'));

    expect(text('details.cancelled herald-status-label')).toBe('Checked in');
    expect(text('details.cancelled li')).toContain('Checked in 12 November 2026, 10:35 · Europe/Madrid · Read-only');
    expect(page().querySelector('details.cancelled button')).toBeNull();
  });

  it('keeps a team’s check-in apart from its roster readiness', { meta: { type: 'covers', description: 'entrant-check-in: A team row keeps check-in and roster apart' } }, async () => {
    const teams = field(
      [
        confirmed('River Falcons', undefined, { rosterSize: 2, rosterRevision: 2, rosterReadiness: 'incomplete' }),
        pending('Team A', { rosterSize: 4, rosterRevision: 4, rosterReadiness: 'complete' }),
      ],
      { entryKind: 'team', capacity: 4, minimumRosterSize: 3, maximumRosterSize: 5 },
      { checkedIn: 1 },
    );
    const { page } = await open(
      { getField: () => of(teams) },
      tournament({ configuration: { ...tournament().configuration, entryKind: 'team', capacity: 4, checkIn: 'mandatory' } }),
    );
    await vi.waitFor(() => expect(row(page, 'River Falcons')).toBeTruthy());

    const falcons = row(page, 'River Falcons');
    expect(falcons.querySelector('herald-status-label')?.textContent).toBe('Checked in');
    expect(falcons.querySelector('.readiness')?.textContent).toBe('2 of 3–5 players · incomplete');
    expect(row(page, 'Team A').querySelector('herald-status-label')?.textContent).toBe('Check-in pending');
    // Roster first, then check-in, then cancelling.
    expect([...falcons.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['Roster', 'Undo check-in', 'Cancel entry']);
    expect(await violations(page())).toEqual([]);
  });
});
