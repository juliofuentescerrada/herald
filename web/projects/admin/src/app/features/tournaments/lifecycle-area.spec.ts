import { TestBed } from '@angular/core/testing';
import { CancelTournament, ChangeDates, TournamentDetails } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import axe from 'axe-core';
import { of, throwError } from 'rxjs';
import { Confirmation } from '../../platform';
import { base, details, notReady, open, organisation, problem, tournamentId } from './tournaments.testing';

const violations = async (element: Element) => (await axe.run(element, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);
const toasts = () => TestBed.inject(Toasts).toasts().map((toast) => toast.text);
const dialog = () => document.querySelector<HTMLElement>('[role=dialog]');
const dialogText = () => dialog()?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const dialogButton = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find((b) => b.textContent?.trim() === text)!;

const published = (over: Partial<TournamentDetails> = {}) =>
  details({ publication: 'published', registration: 'open', revision: 3, admittedEntries: 3, waitingEntries: 1, ...over });
const running = () => published({ registration: 'closed', competition: 'running', revision: 5, start: { ...notReady, startedAt: '2026-11-14T09:05:00Z', startedOnScheduleRevision: 1 } });
const cancelled = (over: Partial<TournamentDetails> = {}) =>
  published({
    registration: 'closed',
    competition: 'cancelled',
    revision: 6,
    cancellation: { cancelledAt: '2026-11-14T14:20:00Z', cancelledByName: 'Alex Morgan', reason: 'Venue flooded', afterStart: true },
    start: { ...notReady, startedAt: '2026-11-14T09:05:00Z', startedOnScheduleRevision: 1 },
    ...over,
  });

async function render(tournament: TournamentDetails, api: Record<string, unknown> = {}, confirm: (options: Confirmation) => boolean = () => true) {
  const view = await open(`/${tournamentId}`, { getTournament: () => of(tournament), listTournaments: () => of([]), ...api }, confirm);
  await vi.waitFor(() => expect(view.page().querySelector('app-lifecycle-area')).not.toBeNull());
  await view.settle();
  const button = (text: string) => [...view.page().querySelectorAll<HTMLButtonElement>('app-lifecycle-area button')].find((b) => b.textContent?.trim() === text);
  const type = async (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    await view.settle();
  };
  return { ...view, button, type };
}

describe('The tournament lifecycle actions', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('change only the selected date after a preview with the old and new values', async () => {
    const changeDates = vi.fn((_o: string, _t: string, body: ChangeDates) => of(published({ revision: 4, configuration: { ...published().configuration, plannedStartAt: body.plannedStartAt! } })));
    const { button, settle, type, page } = await render(published(), { changeDates });

    button('Change dates')!.click();
    await settle();
    expect(dialogText()).toContain('Select the dates to change. The others stay as they are. Time zone: Europe/Madrid.');
    expect(dialogText()).toContain('Now: 14 November 2026, 10:00');
    expect(dialogButton('Save dates').disabled).toBe(true);

    dialog()!.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[2].dispatchEvent(new Event('change'));
    await settle();
    await type(document.getElementById('plannedStartAt-new') as HTMLInputElement, '2026-11-21T10:00');
    expect(dialogText()).toContain('Planned start: 14 November 2026, 10:00 → 21 November 2026, 10:00');
    expect(await violations(dialog()!)).toEqual([]);

    dialogButton('Save dates').click();
    await vi.waitFor(() => expect(toasts()).toContain('Dates changed.'));
    expect(changeDates).toHaveBeenCalledWith(organisation, tournamentId, { expectedRevision: 3, plannedStartAt: '2026-11-21T10:00:00' });
    expect((page().querySelector('#t-plannedStartAt') as HTMLInputElement).value).toBe('2026-11-21T10:00');
  });

  it('name both dates when the closure would fall after the planned start, and change nothing', async () => {
    const changeDates = vi.fn(() => throwError(() => problem(400, { errors: { registrationClosesAt: ['after-planned-start'] } })));
    const { button, settle, type } = await render(published(), { changeDates });

    button('Change dates')!.click();
    await settle();
    dialog()!.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1].dispatchEvent(new Event('change'));
    await settle();
    await type(document.getElementById('registrationClosesAt-new') as HTMLInputElement, '2026-11-15T12:00');
    dialogButton('Save dates').click();
    await vi.waitFor(() => expect(document.getElementById('dates-error')).not.toBeNull());

    expect(document.getElementById('dates-error')!.textContent!.trim()).toBe(
      'Error: Registration closes after the planned start. Move the closure to or before 14 November 2026, 10:00.',
    );
    expect(await violations(dialog()!)).toEqual([]);
  });

  it('offer no date change after start and keep the dates read-only in the form', async () => {
    const { button, page, text } = await render(running());

    expect(button('Change dates')).toBeUndefined();
    expect(button('Cancel tournament')).toBeDefined();
    expect(text('app-lifecycle-area .help')).toBe('The dates are fixed now the competition has started.');
    expect((page().querySelector('#t-plannedStartAt') as HTMLInputElement).readOnly).toBe(true);
    expect(text('#t-plannedStartAt-help')).toBe('Fixed when the competition started.');
    expect(await violations(page())).toEqual([]);
  });

  it('keep a published tournament’s dates out of the form, pointing to Change dates', async () => {
    const { page, text } = await render(published());

    expect((page().querySelector('#t-registrationOpensAt') as HTMLInputElement).readOnly).toBe(true);
    expect(text('#t-registrationOpensAt-help')).toBe('Change it through “Change dates” above.');
  });

  it('cancel before start with a required reason, naming the entries cancelled and the schedule withdrawn', async () => {
    const cancelTournament = vi.fn((_o: string, _t: string, _body: CancelTournament) => of(cancelled({ cancellation: { cancelledAt: '2026-11-10T14:20:00Z', cancelledByName: 'Alex Morgan', reason: 'Venue unavailable', afterStart: false }, start: notReady, revision: 4 })));
    const { button, settle, type, page } = await render(published({ schedulePublished: true }), { cancelTournament });

    button('Cancel tournament')!.click();
    await settle();
    expect(dialogText()).toContain('Registration closes. 3 admitted and 1 waiting entry will be cancelled; nobody is promoted. The published schedule is withdrawn.');
    expect(await violations(dialog()!)).toEqual([]);
    dialogButton('Cancel tournament').click();
    await settle();
    expect(document.getElementById('cancel-reason-error')?.textContent?.trim()).toBe('Error: Enter why the tournament is cancelled.');
    expect(cancelTournament).not.toHaveBeenCalled();

    await type(document.getElementById('cancel-reason') as HTMLTextAreaElement, 'Venue unavailable');
    dialogButton('Cancel tournament').click();
    await vi.waitFor(() => expect(toasts()).toContain('Autumn Open cancelled.'));
    await settle();

    expect(cancelTournament).toHaveBeenCalledWith(organisation, tournamentId, { reason: 'Venue unavailable', expectedRevision: 3 });
    expect(page().querySelector('app-lifecycle-area herald-notice')?.textContent).toContain('Its entries were cancelled and a published schedule withdrawn.');
  });

  it('cancel after start, naming the results that stay and the matches voided', async () => {
    const matches = [
      { matchId: 'm1', round: 1, state: 'resolved' },
      { matchId: 'm2', round: 1, state: 'scheduled' },
      { matchId: 'm3', round: 2, state: 'inPlay' },
    ];
    const { button, settle } = await render(running(), { getSchedule: () => of({ matches }) });

    button('Cancel tournament')!.click();
    await vi.waitFor(() => expect(dialogText()).toContain('1 result recorded so far stay. 2 unresolved matches will be voided with no points. No champion or final ranking is declared.'));
    await settle();
    expect(await violations(dialog()!)).toEqual([]);
  });

  it('show a cancelled tournament read-only with when and by whom, and offer only archiving', async () => {
    const { button, page, text } = await render(cancelled());

    expect(text('.labels')).toContain('Cancelled');
    expect(text('app-lifecycle-area herald-notice')).toContain('Cancelled by Alex Morgan, 14 November 2026, 15:20 · Europe/Madrid. Reason: Venue flooded. Nothing can change.');
    expect(button('Archive')).toBeDefined();
    expect(button('Cancel tournament')).toBeUndefined();
    expect([...page().querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Save changes')).toBe(false);
    expect((page().querySelector('#t-title') as HTMLInputElement).readOnly).toBe(true);
    expect(await violations(page())).toEqual([]);
  });

  it('archive a cancelled tournament without asking, and unarchive it', async () => {
    const archiveTournament = vi.fn(() => of(cancelled({ archived: true, revision: 7 })));
    const unarchiveTournament = vi.fn(() => of(cancelled({ archived: false, revision: 8 })));
    const { button, settle, text } = await render(cancelled(), { archiveTournament, unarchiveTournament });

    button('Archive')!.click();
    await vi.waitFor(() => expect(toasts()).toContain('Autumn Open archived. It is hidden from the list unless “Show archived” is chosen.'));
    await settle();
    expect(archiveTournament).toHaveBeenCalledWith(organisation, tournamentId, { expectedRevision: 6 });
    expect(text('.labels')).toContain('Archived');

    button('Unarchive')!.click();
    await vi.waitFor(() => expect(unarchiveTournament).toHaveBeenCalledWith(organisation, tournamentId, { expectedRevision: 7 }));
  });

  it('delete a draft after a confirmation and return to the list', async () => {
    const deleteDraft = vi.fn(() => of(undefined));
    const asked: Confirmation[] = [];
    const { button, router } = await render(details(), { deleteDraft }, (question) => {
      asked.push(question);
      return true;
    });

    button('Delete draft')!.click();
    await vi.waitFor(() => expect(router.url).toBe(base));

    expect(asked[0]).toMatchObject({ heading: 'Delete Autumn Open?', confirmLabel: 'Delete draft', destructive: true });
    expect(deleteDraft).toHaveBeenCalledWith(organisation, tournamentId, { expectedRevision: 1 });
    expect(toasts()).toContain('Autumn Open deleted.');
  });

  it('keep a draft when the confirmation is declined', async () => {
    const deleteDraft = vi.fn(() => of(undefined));
    const { button, settle } = await render(details(), { deleteDraft }, () => false);

    button('Delete draft')!.click();
    await settle();

    expect(deleteDraft).not.toHaveBeenCalled();
  });
});
