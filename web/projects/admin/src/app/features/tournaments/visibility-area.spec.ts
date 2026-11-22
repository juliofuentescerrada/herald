import { TestBed } from '@angular/core/testing';
import { PublicPreview, TournamentDetails } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import axe from 'axe-core';
import { of, throwError } from 'rxjs';
import { Confirmation } from '../../platform';
import { details, open, organisation, problem, tournamentId } from './tournaments.testing';

const violations = async (element: Element) => (await axe.run(element, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);
const toasts = () => TestBed.inject(Toasts).toasts().map((toast) => toast.text);
const dialog = () => document.querySelector<HTMLElement>('[role=dialog]');
const dialogText = () => dialog()?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const dialogButton = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find((b) => b.textContent?.trim() === text)!;

const published = (visibility: 'public' | 'unlisted' | 'private' = 'public', over: Partial<TournamentDetails> = {}) =>
  details({ publication: 'published', registration: 'open', revision: 3, ...over }, { visibility });

const preview = (aliases: string[]): PublicPreview => ({
  page: { title: 'Autumn Open', plannedStartAt: '2026-11-14T10:00:00', timeZone: 'Europe/Madrid' } as PublicPreview['page'],
  aliases,
});

async function render(tournament: TournamentDetails, api: Record<string, unknown> = {}, confirm: (options: Confirmation) => boolean = () => true) {
  const view = await open(`/${tournamentId}`, { getTournament: () => of(tournament), listTournaments: () => of([]), ...api }, confirm);
  await vi.waitFor(() => expect(view.page().querySelector('app-visibility-area')).not.toBeNull());
  await view.settle();
  const area = () => view.page().querySelector<HTMLElement>('app-visibility-area')!;
  const button = (text: string) => [...area().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;
  return { ...view, area, button };
}

describe('The tournament’s visibility', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows the current visibility with Change visibility and a link to the public page, and locks the form’s field (visibility-panel)', async () => {
    const { area, page } = await render(published());

    expect(area().querySelector('herald-status-label')?.textContent?.trim()).toBe('Public');
    expect(area().querySelector('a')?.textContent?.trim()).toBe('View public page');
    expect(area().querySelector('a')?.getAttribute('href')).toBe(`/tournaments/${tournamentId}`);
    expect(page().querySelector<HTMLSelectElement>('#t-visibility')?.disabled).toBe(true);
    expect(await violations(area())).toEqual([]);
  });

  it('makes a public tournament private after a confirmation, and offers no public page any more (visibility-to-private)',
    { meta: { type: 'covers', description: 'public-tournament-page: Public to private' } }, async () => {
      const asked: Confirmation[] = [];
      const changeVisibility = vi.fn(() => of(published('private', { revision: 4 })));
      const { area, button, settle } = await render(published(), { changeVisibility }, (question) => (asked.push(question), true));

      button('Change visibility').click();
      await vi.waitFor(() => expect(toasts()).toContain('Autumn Open is private.'));
      await settle();

      expect(asked[0].heading).toBe('Make Autumn Open private?');
      expect(asked[0].body).toContain('see “not available” from the moment you confirm');
      expect(changeVisibility).toHaveBeenCalledWith(organisation, tournamentId, { visibility: 'private', expectedRevision: 3 });
      expect(area().querySelector('herald-status-label')?.textContent?.trim()).toBe('Private');
      expect(area().querySelector('a')).toBeNull();
    });

  it('previews the title, dates and entrant aliases before making a private tournament public (visibility-preview)',
    { meta: { type: 'covers', description: 'public-tournament-page: Private to public' } }, async () => {
      const changeVisibility = vi.fn(() => of(published('unlisted', { revision: 4 })));
      const { button, settle } = await render(published('private'), { changeVisibility, getPublicPreview: () => of(preview(['Jamie Brook', 'Robin Vale'])) });

      button('Change visibility').click();
      await vi.waitFor(() => expect(dialogText()).toContain('What becomes public'));
      expect([...dialog()!.querySelectorAll('dd')].map((dd) => dd.textContent?.trim()).slice(0, 3))
        .toEqual(['Autumn Open', '14 November 2026, 10:00 · Europe/Madrid', 'Jamie Brook, Robin Vale']);
      expect(await violations(dialog()!)).toEqual([]);

      dialog()!.querySelectorAll<HTMLInputElement>('input[type=radio]')[1].dispatchEvent(new Event('change'));
      await settle();
      dialogButton('Make unlisted').click();
      await vi.waitFor(() => expect(toasts()).toContain('Autumn Open is unlisted.'));
      expect(changeVisibility).toHaveBeenCalledWith(organisation, tournamentId, { visibility: 'unlisted', expectedRevision: 3 });
    });

  it('keeps the dialog open with the reason when the tournament changed elsewhere', async () => {
    const changeVisibility = vi.fn(() => throwError(() => problem(409)));
    const { button, settle } = await render(published('private'), { changeVisibility, getPublicPreview: () => of(preview([])) });

    button('Change visibility').click();
    await vi.waitFor(() => expect(dialogText()).toContain('None yet: the page names entrants once the schedule is published'));
    dialogButton('Make public').click();
    await vi.waitFor(() => expect(dialogText()).toContain('The tournament changed elsewhere. Nothing changed.'));
    await settle();
    expect(dialog()).not.toBeNull();
  });
});
