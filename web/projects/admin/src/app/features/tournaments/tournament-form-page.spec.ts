import { TestBed } from '@angular/core/testing';
import { SaveTournament, TournamentConfiguration } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AccessState, Confirmation } from '../../platform';
import { base, details, open, problem, team, tournamentId } from './tournaments.testing';

type Answer = () => Observable<unknown>;

async function render(path: string, options: { reads?: Answer[]; writes?: Answer[]; confirm?: (options: Confirmation) => boolean } = {}) {
  const { reads = [], writes = [] } = options;
  const created: { tournamentId: string; configuration: TournamentConfiguration }[] = [];
  const saved: SaveTournament[] = [];
  const view = await open(
    path,
    {
      getTournament: () => reads.shift()!(),
      createTournament: (_o: string, body: (typeof created)[number]) => {
        created.push(body);
        return (writes.shift() ?? (() => of(details({ id: body.tournamentId, missingForPublication: ['capacity'] }, body.configuration))))();
      },
      saveTournament: (_o: string, _t: string, body: SaveTournament) => {
        saved.push(body);
        return (writes.shift() ?? (() => of(details({ revision: body.expectedRevision + 1 }, body.configuration))))();
      },
    },
    options.confirm,
  );
  if (path !== '/new') await vi.waitFor(() => expect(view.page().querySelector('form')).not.toBeNull());
  const control = (name: string) => view.page().querySelector<HTMLInputElement | HTMLSelectElement>(`#t-${name}`);
  const type = async (name: string, value: string) => {
    const element = control(name)!;
    element.value = value;
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input'));
    await view.settle();
  };
  const submit = async () => {
    view.page().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await view.settle();
  };
  return { ...view, control, type, submit, created, saved };
}

const toasts = () => TestBed.inject(Toasts).toasts().map((toast) => toast.text);

describe('The tournament configuration form', () => {
  beforeEach(() => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: 'Europe/Madrid' } as Intl.ResolvedDateTimeFormatOptions);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('preselects nothing on a new tournament except the time zone proposed from the browser', async () => {
    const { page, control, text } = await render('/new');
    expect(text('h1')).toBe('Create tournament');
    const filled = [...page().querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')].filter((c) => c.value).map((c) => c.id);
    expect(filled).toEqual(['t-profile', 't-timeZone']);
    expect(control('timeZone')!.value).toBe('Europe/Madrid');
    expect((control('profile') as HTMLInputElement).readOnly).toBe(true);
    expect(control('profile')!.value).toBe('Single round-robin · 3 / 1 / 0');
    expect(control('minimumRosterSize')).toBeNull();
    expect(text('#review-why')).toBe('Review is unavailable. Save the draft first: the review shows what is saved.');
  });

  it('reveals the team structure and labels capacity in teams without losing input', async () => {
    const { control, type, text } = await render('/new');
    await type('title', 'Autumn Open');
    await type('entryKind', 'team');
    expect(text('label[for="t-capacity"]')).toBe('Capacity in teams');
    expect(control('title')!.value).toBe('Autumn Open');

    await type('minimumRosterSize', '3');
    await type('entryKind', 'individual');
    expect(control('minimumRosterSize')).toBeNull();
    expect(text('label[for="t-capacity"]')).toBe('Capacity in individual entries');
    await type('entryKind', 'team');
    expect(control('minimumRosterSize')!.value).toBe('3');
  });

  it('hides the venue of an online tournament and keeps it for coming back', async () => {
    const { control, type } = await render('/new');
    await type('venue', 'Northside Hall');
    await type('location', 'online');
    expect(control('venue')).toBeNull();
    await type('location', 'onSite');
    expect(control('venue')!.value).toBe('Northside Hall');
  });

  it('writes each date-time out next to its control', async () => {
    const { control, type, text } = await render('/new');
    await type('plannedStartAt', '2026-11-14T10:00');
    expect(text('#t-plannedStartAt-text')).toBe('14 November 2026, 10:00');
    expect(control('plannedStartAt')!.getAttribute('aria-describedby')).toBe('t-plannedStartAt-help t-plannedStartAt-text');
  });

  it('creates a draft from a title alone and moves to the address of the tournament', async () => {
    const { type, submit, created, router, text, texts } = await render('/new');
    await type('title', '  Autumn Open ');
    await submit();
    await vi.waitFor(() => expect(router.url).toBe(`${base}/${created[0].tournamentId}`));
    expect(created[0].configuration).toMatchObject({ title: 'Autumn Open', capacity: null, entryKind: null, timeZone: 'Europe/Madrid' });
    expect(toasts()).toEqual(['Draft saved. It is not ready to publish yet.']);
    expect(text('herald-notice strong')).toBeUndefined();
    expect(text('h1')).toBe('Configure Autumn Open');
    expect(texts('.summary li')).toEqual(['Capacity']);
  });

  it('loads a team draft and saves it against the revision it read, without the values of hidden controls', async () => {
    const { control, type, submit, saved, text } = await render(`/${tournamentId}`, { reads: [() => of(details({ revision: 3 }, team))] });
    expect(control('maximumRosterSize')!.value).toBe('5');
    expect(control('plannedStartAt')!.value).toBe('2026-11-14T10:00');
    expect(text('button[type="submit"]')).toBe('Save draft');

    await type('entryKind', 'individual');
    await type('location', 'online');
    await submit();
    expect(saved[0].expectedRevision).toBe(3);
    expect(saved[0].configuration).toMatchObject({ entryKind: 'individual', maximumRosterSize: null, location: 'online', venue: null, plannedStartAt: '2026-11-14T10:00:00' });
    await vi.waitFor(() => expect(toasts()).toEqual(['Draft saved. It has everything publication needs.']));
  });

  it('offers the review of a complete, saved draft and withdraws it while changes are unsaved', async () => {
    const { page, type, text } = await render(`/${tournamentId}`, { reads: [() => of(details())] });
    const review = () => [...page().querySelectorAll('.actions a')].find((a) => a.textContent?.trim() === 'Review and publish');
    expect(review()?.getAttribute('href')).toBe(`${base}/${tournamentId}/review`);
    await type('capacity', '32');
    expect(review()).toBeUndefined();
    expect(text('#review-why')).toContain('Save your changes first');
  });

  it('lists what a draft lacks for publication, moves focus to the field and explains why review is unavailable', async () => {
    const { page, control, text, texts } = await render(`/${tournamentId}`, {
      reads: [() => of(details({ missingForPublication: ['timeZone', 'visibility'] }, { timeZone: null, visibility: null }))],
    });
    expect(text('#missing-summary')).toBe('Missing for publication');
    expect(texts('.summary li')).toEqual(['Reference time zone', 'Visibility']);
    page().querySelector<HTMLAnchorElement>('.summary a')!.click();
    expect(document.activeElement).toBe(control('timeZone'));
    expect(text('#review-why')).toBe('Review is unavailable. Complete the values missing for publication first.');
    expect(page().querySelector<HTMLButtonElement>('button[aria-describedby="review-why"]')!.disabled).toBe(true);
  });

  it('shows rejected values at their fields and in a summary that takes focus, keeping what was typed', async () => {
    const rejection = problem(400, { errors: { capacity: ['out-of-range'], registrationClosesAt: ['after-planned-start'] } });
    const { page, control, type, submit, text, texts } = await render(`/${tournamentId}`, { reads: [() => of(details())], writes: [() => throwError(() => rejection)] });
    await type('capacity', '1');
    await submit();
    await vi.waitFor(() => expect(document.activeElement).toBe(page().querySelector('.summary.danger')));
    expect(text('#error-summary')).toBe('Correct 2 fields to save');
    expect(texts('.summary li')).toEqual([
      'Capacity: Capacity must be between 2 and 256.',
      'Registration closure: Registration must close no later than the planned start.',
    ]);
    expect(control('capacity')!.value).toBe('1');
    expect(control('capacity')!.getAttribute('aria-invalid')).toBe('true');
    expect(control('capacity')!.getAttribute('aria-describedby')).toBe('t-capacity-help t-capacity-error');
    // "Error:" and an icon: colour is not the only signal (V-4).
    expect(text('#t-capacity-error')).toBe('Error: Capacity must be between 2 and 256.');
    expect(page().querySelector('#t-capacity-error herald-icon')).not.toBeNull();
    expect(control('title')!.getAttribute('aria-invalid')).toBeNull();

    page().querySelector<HTMLAnchorElement>('.summary a')!.click();
    expect(document.activeElement).toBe(control('capacity'));

    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('shows it is saving and does not submit twice', async () => {
    const { page, control, type, submit, saved, text } = await render(`/${tournamentId}`, { reads: [() => of(details())], writes: [() => new Subject()] });
    await type('capacity', '32');
    await submit();
    expect(text('form [role="status"]')).toContain('Saving');
    expect(page().querySelector('form')!.getAttribute('aria-busy')).toBe('true');
    expect((control('title') as HTMLInputElement).readOnly).toBe(true);
    expect((control('entryKind') as HTMLSelectElement).disabled).toBe(true);
    await submit();
    expect(saved).toHaveLength(1);
  });

  it('keeps everything and the same identifier when creating fails and is tried again', async () => {
    const { control, type, submit, created, text, router } = await render('/new', { writes: [() => throwError(() => problem(500))] });
    await type('title', 'Autumn Open');
    await submit();
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('Draft not saved'));
    expect(control('title')!.value).toBe('Autumn Open');
    expect(text('button[type="submit"]')).toBe('Try again');

    await submit();
    await vi.waitFor(() => expect(router.url).toBe(`${base}/${created[0].tournamentId}`));
    expect(created[1].tournamentId).toBe(created[0].tournamentId);
  });

  it('keeps what was typed after a conflict and reloads the latest only when the owner agrees', async () => {
    const answers = [false, true];
    const { page, control, type, submit, text } = await render(`/${tournamentId}`, {
      reads: [() => of(details()), () => of(details({ revision: 2 }, { capacity: 64 }))],
      writes: [() => throwError(() => problem(409, { currentRevision: 2 }))],
      confirm: () => answers.shift()!,
    });
    await type('capacity', '32');
    await submit();
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('This tournament changed elsewhere'));
    expect(control('capacity')!.value).toBe('32');

    const reload = () => [...page().querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Reload latest')!;
    reload().click();
    await new Promise((done) => setTimeout(done));
    expect(control('capacity')!.value).toBe('32');

    reload().click();
    await vi.waitFor(() => expect(control('capacity')!.value).toBe('64'));
    expect(page().querySelector('herald-notice')).toBeNull();
  });

  it.each([
    ['individual', {}, 'Card game · Constructed · Individual · Northside Hall'],
    ['team', team, 'Card game · Constructed · Team · Northside Hall'],
  ])('shows a published %s tournament with its facts, editable, and nothing to start it', async (_kind, config, facts) => {
    const { page, type, submit, saved, text, texts } = await render(`/${tournamentId}`, {
      reads: [() => of(details({ publication: 'published' }, config))],
      writes: [() => of(details({ publication: 'published', revision: 2 }, { ...config, capacity: 32 }))],
    });
    expect(text('h1')).toBe('Autumn Open');
    expect(texts('p.lead')).toEqual([facts, '14 November 2026, 10:00 · Europe/Madrid']);
    expect(texts('herald-status-label')).toEqual(['Published', 'Registration not open', 'Preparing']);
    expect(texts('.actions a, .actions button')).toEqual(['Save changes', 'Back to tournaments']);
    // V-1: the draft sentence does not belong on a published tournament.
    expect(page().textContent).not.toContain('A draft can be saved');
    expect(page().textContent).not.toMatch(/start (the )?tournament/i);

    await type('capacity', '32');
    await submit();
    expect(saved[0].configuration.capacity).toBe(32);
    await vi.waitFor(() => expect(toasts()).toEqual(['Changes saved.']));
    // The outcome is a toast only: no persistent success notice remains on the page.
    expect(texts('herald-notice strong')).toEqual(['Published · configuration remains editable']);
  });

  it('shows registration and entries before the form for a published tournament, and neither for a draft', async () => {
    const published = await render(`/${tournamentId}`, { reads: [() => of(details({ publication: 'published' }))] });
    expect(published.page().querySelector('app-registration-area')?.compareDocumentPosition(published.page().querySelector('form')!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(published.texts('h2')).toContain('Entries');
    TestBed.resetTestingModule();
    const draft = await render(`/${tournamentId}`, { reads: [() => of(details())] });
    expect(draft.page().querySelector('app-registration-area, #entries-heading')).toBeNull();
  });

  it('asks before leaving with unsaved input, and declining keeps the page and the input', async () => {
    const asked: string[] = [];
    const { control, type, router } = await render('/new', {
      confirm: (options) => {
        asked.push(options.heading);
        return false;
      },
    });
    await type('title', 'Autumn Open');
    expect(await router.navigateByUrl(base)).toBe(false);
    expect(asked).toHaveLength(1);
    expect(router.url).toBe(`${base}/new`);
    expect(control('title')!.value).toBe('Autumn Open');
  });

  it('offers what was typed for copying if access stops', async () => {
    const { type } = await render('/new');
    await type('title', 'Autumn Open');
    const access = TestBed.inject(AccessState);
    access.report('session-expired');
    expect(access.unsavedInput()).toBe('Title: Autumn Open\nReference time zone: Europe/Madrid');
  });

  it('links a published tournament to its entries with the counts', async () => {
    const { page, text } = await render(`/${tournamentId}`, { reads: [() => of(details({ publication: 'published', admittedEntries: 3, waitingEntries: 1 }))] });
    expect(text('#entries-heading')).toBe('Entries');
    expect(text('.summary.entries p')).toBe('3 of 16 individual entries admitted · 1 waiting');
    expect(page().querySelector('.summary.entries a')?.getAttribute('href')).toBe(`${base}/${tournamentId}/entries`);
  });

  it('puts the back arrow and the entries icon before their links’ text, keeping their names', { meta: { type: 'covers', description: 'interface-icons: Back and entries links carry icons' } }, async () => {
    const { page } = await render(`/${tournamentId}`, { reads: [() => of(details({ publication: 'published' }))] });
    await vi.waitFor(() => expect(page().querySelector('.summary.entries a')).toBeTruthy());
    const back = page().querySelector('a.back')!;
    const entries = page().querySelector('.summary.entries a')!;
    expect([back, entries].map((a) => [a.firstElementChild?.getAttribute('data-icon'), a.textContent?.trim()])).toEqual([
      ['arrow-left', 'Back to tournaments'],
      ['users', 'View entries'],
    ]);
    expect([back, entries].map((a) => a.querySelector('svg')?.getAttribute('aria-hidden'))).toEqual(['true', 'true']);
  });

  it('has no entries link on a draft', async () => {
    const { page } = await render(`/${tournamentId}`, { reads: [() => of(details())] });
    expect(page().querySelector('.summary.entries')).toBeNull();
  });

  it('locks entry kind and admission while entries exist, saying why, and gives the lowest capacity allowed', { meta: { type: 'covers', description: 'tournament-setup: The form explains the locked fields' } }, async () => {
    const { page, control, text } = await render(`/${tournamentId}`, { reads: [() => of(details({ publication: 'published', admittedEntries: 3, waitingEntries: 1 }))] });
    for (const name of ['entryKind', 'admission']) {
      expect((control(name) as HTMLSelectElement).disabled).toBe(true);
      expect(text(`#t-${name}-help`)).toBe('Locked while the tournament has entries. Cancel every entry to change it.');
    }
    expect(text('#t-capacity-help')).toBe('How many entries the tournament admits. At least 3: the admitted entries.');
    expect((control('capacity') as HTMLInputElement).readOnly).toBe(false);
    // Admitted entries without check-ins leave the policy free (h1-check-in R-7).
    expect((control('checkIn') as HTMLSelectElement).disabled).toBe(false);
    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('locks the check-in policy while entries have checked in, saying why', { meta: { type: 'covers', description: 'tournament-setup: The form explains the locked check-in policy' } }, async () => {
    const { page, control, text } = await render(`/${tournamentId}`, {
      reads: [() => of(details({ publication: 'published', admittedEntries: 4, waitingEntries: 1, checkedInEntries: 1 }))],
    });
    expect((control('checkIn') as HTMLSelectElement).disabled).toBe(true);
    expect(text('#t-checkIn-help')).toBe('Entries have checked in. Undo every check-in to change it.');
    expect(text('.summary.entries p')).toBe('4 of 16 individual entries admitted · 1 waiting');
    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('leaves entry kind and admission editable once every entry is cancelled', async () => {
    const { control } = await render(`/${tournamentId}`, { reads: [() => of(details({ publication: 'published' }))] });
    expect((control('entryKind') as HTMLSelectElement).disabled).toBe(false);
    expect((control('admission') as HTMLSelectElement).disabled).toBe(false);
  });

  it('shows a capacity below the admitted entries as rejected, keeping the value typed', async () => {
    const rejection = problem(400, { errors: { capacity: ['below-admitted'] } });
    const { control, type, submit, text, texts } = await render(`/${tournamentId}`, {
      reads: [() => of(details({ publication: 'published', admittedEntries: 3 }))],
      writes: [() => throwError(() => rejection)],
    });
    await type('capacity', '2');
    await submit();
    await vi.waitFor(() => expect(text('#error-summary')).toBe('Correct 1 field to save'));
    expect(texts('.summary.danger li')).toEqual(['Capacity: Capacity cannot be lower than the admitted entries.']);
    expect(control('capacity')!.value).toBe('2');
  });

  it('says a tournament that cannot be read is not available', async () => {
    const view = await open(`/${tournamentId}`, { getTournament: () => throwError(() => problem(404)) });
    await vi.waitFor(() => expect(view.text('herald-notice strong')).toBe('Tournament not available'));
    expect(view.page().querySelector('form')).toBeNull();
  });

  it('has no automatically detectable accessibility violations on a team draft', async () => {
    const { page } = await render(`/${tournamentId}`, { reads: [() => of(details({ missingForPublication: ['visibility'] }, { ...team, visibility: null }))] });
    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
