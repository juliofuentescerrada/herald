import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { details, open, problem, tournamentId } from './tournaments.testing';

type Answer = () => Observable<unknown>;

const published = (over: Parameters<typeof details>[0] = {}, config: Parameters<typeof details>[1] = {}) =>
  details({ publication: 'published', revision: 2, ...over }, config);

async function render(reads: Answer[], writes: { open?: Answer[]; close?: Answer[]; save?: Answer[] } = {}, confirm = () => true) {
  const calls: { action: string; expectedRevision: number }[] = [];
  const view = await open(
    `/${tournamentId}`,
    {
      getTournament: () => reads.shift()!(),
      openRegistration: (_o: string, _t: string, body: { expectedRevision: number }) => {
        calls.push({ action: 'open', ...body });
        return writes.open!.shift()!();
      },
      closeRegistration: (_o: string, _t: string, body: { expectedRevision: number }) => {
        calls.push({ action: 'close', ...body });
        return writes.close!.shift()!();
      },
      saveTournament: () => writes.save!.shift()!(),
    },
    confirm,
  );
  await vi.waitFor(() => expect(view.page().querySelector('form')).not.toBeNull());
  const area = () => view.page().querySelector<HTMLElement>('app-registration-area');
  const action = () => area()!.querySelector<HTMLButtonElement>('section > button')!;
  const type = async (name: string, value: string) => {
    const control = view.page().querySelector<HTMLInputElement>(`#t-${name}`)!;
    control.value = value;
    control.dispatchEvent(new Event('input'));
    await view.settle();
  };
  return { ...view, calls, area, action, type };
}

describe('The registration area', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('offers to open registration with the announced window written out', async () => {
    const { area, action, texts } = await render([() => of(published())]);
    expect(area()!.querySelector('.state')?.textContent).toBe('Registration not open');
    expect([...area()!.querySelectorAll('dd')].map((d) => d.textContent?.trim())).toEqual([
      '1 November 2026, 09:00',
      '13 November 2026, 18:00',
      'Europe/Madrid',
    ]);
    expect(area()!.textContent).toContain('Registration changes only with the action below, not automatically at these times.');
    expect(action().textContent?.trim()).toBe('Open registration');
    expect(action().disabled).toBe(false);
    expect(texts('herald-notice strong')).toEqual(['Published · configuration remains editable']);

    const { violations } = await axe.run(area()!, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('names the missing dates, links each to its field and explains why it cannot open', async () => {
    const { page, area, action } = await render([
      () => of(published({ missingForRegistration: ['registrationOpensAt', 'registrationClosesAt'] }, { registrationOpensAt: null, registrationClosesAt: null })),
    ]);
    expect([...area()!.querySelectorAll('dd')].slice(0, 2).map((d) => d.textContent?.trim())).toEqual(['Not set', 'Not set']);
    expect([...area()!.querySelectorAll('li')].map((l) => l.textContent?.trim())).toEqual(['Set registration opening', 'Set registration closure']);
    expect(action().disabled).toBe(true);
    expect(action().getAttribute('aria-describedby')).toBe('registration-reason');
    expect(area()!.querySelector('#registration-reason')?.textContent?.trim()).toBe('Set both registration dates before opening registration.');

    area()!.querySelector<HTMLAnchorElement>('li a')!.click();
    expect(document.activeElement).toBe(page().querySelector('#t-registrationOpensAt'));
  });

  it('asks to save unsaved changes first', async () => {
    const { area, action, type } = await render([() => of(published())]);
    await type('capacity', '32');
    expect(action().disabled).toBe(true);
    expect(area()!.querySelector('#registration-reason')?.textContent?.trim()).toBe('Save your changes first.');
  });

  it('opens the revision on screen, shows it is opening and does not ask twice', async () => {
    const pending = new Subject<unknown>();
    const { area, action, calls, settle } = await render([() => of(published({ revision: 3 }))], { open: [() => pending] });
    action().click();
    await settle();
    expect(action().textContent?.trim()).toBe('Opening registration…');
    expect(area()!.querySelector('section')?.getAttribute('aria-busy')).toBe('true');
    action().click();
    expect(calls).toEqual([{ action: 'open', expectedRevision: 3 }]);
  });

  it('shows an open registration with when it opened, and closes it', async () => {
    const opened = published({ revision: 3, registration: 'open', registrationChangedAt: '2026-11-11T08:30:00Z' });
    const closed = published({ revision: 4, registration: 'closed', registrationChangedAt: '2026-11-12T17:00:00Z' });
    const { area, action, texts, calls } = await render([() => of(published())], { open: [() => of(opened)], close: [() => of(closed)] });

    action().click();
    await vi.waitFor(() => expect(action().textContent?.trim()).toBe('Close registration'));
    expect(texts('herald-status-label')).toEqual(['Published', 'Registration open', 'Preparing']);
    // W-1: the time in the reference zone, without the person's name.
    expect(area()!.querySelector('.last')?.textContent).toBe('Opened 11 November 2026, 09:30 · Europe/Madrid');

    action().click();
    await vi.waitFor(() => expect(action().textContent?.trim()).toBe('Reopen registration'));
    expect(texts('herald-status-label')[1]).toBe('Registration closed');
    expect(area()!.querySelector('.last')?.textContent).toBe('Closed 12 November 2026, 18:00 · Europe/Madrid');
    expect(calls).toEqual([
      { action: 'open', expectedRevision: 2 },
      { action: 'close', expectedRevision: 3 },
    ]);
  });

  it('says a failed opening left registration not open and offers to try again', async () => {
    const { area, action, texts } = await render([() => of(published())], { open: [() => throwError(() => problem(500)), () => of(published({ registration: 'open' }))] });
    action().click();
    await vi.waitFor(() => expect(area()!.querySelector('herald-notice strong')?.textContent?.trim()).toBe('Registration was not opened'));
    expect(texts('herald-status-label')[1]).toBe('Registration not open');
    expect(action().textContent?.trim()).toBe('Open registration');

    action().click();
    await vi.waitFor(() => expect(action().textContent?.trim()).toBe('Close registration'));
  });

  it('says the tournament changed elsewhere and reloads the latest only when the owner agrees', async () => {
    const { area, action, type } = await render(
      [() => of(published()), () => of(published({ revision: 3, registration: 'open' }))],
      { open: [() => throwError(() => problem(409, { currentRevision: 3 }))] },
    );
    action().click();
    await vi.waitFor(() => expect(area()!.querySelector('herald-notice strong')?.textContent?.trim()).toBe('This tournament changed elsewhere'));
    expect(action().disabled).toBe(true);
    expect(area()!.querySelector('#registration-reason')?.textContent?.trim()).toBe('Reload the latest version first.');
    await type('venue', 'Madrid · Main hall');

    [...area()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Reload latest')!.click();
    await vi.waitFor(() => expect(action().textContent?.trim()).toBe('Close registration'));
    expect(area()!.querySelector('herald-notice')).toBeNull();
  });

  it('keeps an open registration when a save without a registration date is rejected', async () => {
    const rejection = problem(400, { errors: { registrationClosesAt: ['required'] } });
    const { page, area, type, settle, text } = await render([() => of(published({ registration: 'open' }))], { save: [() => throwError(() => rejection)] });
    await type('registrationClosesAt', '');
    page().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
    await vi.waitFor(() => expect(text('#error-summary')).toBe('Correct 1 field to save'));
    expect(text('#t-registrationClosesAt-error')).toBe('Error: Required while registration is open.');
    expect(area()!.querySelector('.state')?.textContent).toBe('Registration open');
  });

  it('is not shown on a draft', async () => {
    const { area } = await render([() => of(details())]);
    expect(area()).toBeNull();
  });
});
