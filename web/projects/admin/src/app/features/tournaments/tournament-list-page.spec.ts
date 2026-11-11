import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { base, open, problem } from './tournaments.testing';

const row = (over: object) => ({
  id: 't1',
  title: 'Autumn Open',
  gameVariant: 'Card game · Constructed',
  entryKind: 'individual',
  capacity: 16,
  plannedStartAt: '2026-11-14T10:00:00',
  timeZone: 'Europe/Madrid',
  location: 'onSite',
  venue: 'Northside Hall',
  publication: 'draft',
  registration: 'notOpen',
  competition: 'preparation',
  admittedEntries: 0,
  waitingEntries: 0,
  ...over,
});

const render = (...answers: (() => Observable<unknown>)[]) => open('', { listTournaments: () => answers.shift()!() });

describe('The tournament list', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('says there are no tournaments yet and offers creating one as its only action', async () => {
    const { page, text, texts } = await render(() => of([]));
    await vi.waitFor(() => expect(text('h2')).toBe('No tournaments yet'));
    expect(texts('a[herald-button], button')).toEqual(['Create tournament']);
    expect(page().querySelector('a[herald-button]')?.getAttribute('href')).toBe(`${base}/new`);
  });

  it('shows each tournament with its capacity unit, three separate labels and its action', async () => {
    const published = row({ id: 't2', title: 'Winter Teams', entryKind: 'team', location: 'online', venue: null, publication: 'published' });
    const { page, texts } = await render(() => of([published, row({})]));
    await vi.waitFor(() => expect(page().querySelectorAll('li')).toHaveLength(2));
    const [first, second] = page().querySelectorAll('li');

    expect(first.textContent).toContain('Card game · Constructed · Team · Online');
    expect(first.textContent).toContain('14 November 2026, 10:00 · Europe/Madrid');
    expect(first.querySelector('.capacity')?.textContent).toContain('16 teams');
    expect([...first.querySelectorAll('herald-status-label')].map((l) => l.textContent?.trim())).toEqual(['Published', 'Registration not open', 'Preparing']);
    expect(first.querySelector('a')?.textContent?.trim()).toBe('Edit configuration');
    expect(first.querySelector('a')?.getAttribute('aria-label')).toBe('Edit configuration: Winter Teams');

    expect(second.textContent).toContain('Individual · Northside Hall');
    expect(second.querySelector('.capacity')?.textContent).toContain('16 individual entries');
    expect(second.querySelector('herald-status-label')?.textContent?.trim()).toBe('Draft');
    expect(second.querySelector('a')?.textContent?.trim()).toBe('Continue draft');
    expect(second.querySelector('a')?.getAttribute('href')).toBe(`${base}/t1`);
    expect(texts('.heading a')).toEqual(['Create tournament']);

    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('labels each registration state separately from publication and competition', async () => {
    const rows = ['notOpen', 'open', 'closed'].map((registration, i) => row({ id: `t${i}`, publication: 'published', registration }));
    const { page } = await render(() => of(rows));
    await vi.waitFor(() => expect(page().querySelectorAll('li')).toHaveLength(3));
    expect([...page().querySelectorAll('li')].map((li) => [...li.querySelectorAll('herald-status-label')].map((l) => l.textContent?.trim()))).toEqual([
      ['Published', 'Registration not open', 'Preparing'],
      ['Published', 'Registration open', 'Preparing'],
      ['Published', 'Registration closed', 'Preparing'],
    ]);
  });

  it('shows a published tournament’s admitted and waiting entries and its entries action, and none on a draft', async () => {
    const published = row({ id: 't2', publication: 'published', registration: 'open', admittedEntries: 3, waitingEntries: 1 });
    const empty = row({ id: 't3', title: 'Winter Teams', entryKind: 'team', capacity: 4, publication: 'published', admittedEntries: 0, waitingEntries: 0 });
    const { page } = await render(() => of([published, empty, row({})]));
    await vi.waitFor(() => expect(page().querySelectorAll('li')).toHaveLength(3));
    const [first, second, draft] = page().querySelectorAll('li');

    expect(first.querySelector('.capacity')?.textContent).toBe('3 of 16 individual entries admitted · 1 waiting');
    expect([...first.querySelectorAll('a')].map((a) => [a.textContent?.trim(), a.getAttribute('href'), a.getAttribute('aria-label')])).toEqual([
      ['Edit configuration', `${base}/t2`, 'Edit configuration: Autumn Open'],
      ['Entries', `${base}/t2/entries`, 'Entries: Autumn Open'],
    ]);
    expect(second.querySelector('.capacity')?.textContent).toBe('0 of 4 teams admitted');
    expect(draft.querySelector('.capacity')?.textContent).toBe('Capacity · 16 individual entries');
    expect([...draft.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual(['Continue draft']);

    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('says it is loading', async () => {
    const { text, page } = await render(() => new Subject());
    expect(text('[role="status"]')).toBe('Loading tournaments…');
    expect(page().querySelectorAll('li')).toHaveLength(0);
  });

  it('explains a failed load without rows and loads on retry', async () => {
    const { page, text } = await render(() => throwError(() => problem(500)), () => of([row({})]));
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('Tournaments did not load'));
    expect(page().querySelectorAll('li')).toHaveLength(0);

    page().querySelector<HTMLButtonElement>('button')!.click();
    await vi.waitFor(() => expect(page().querySelectorAll('li')).toHaveLength(1));
  });
});
