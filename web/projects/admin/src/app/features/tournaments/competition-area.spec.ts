import { TestBed } from '@angular/core/testing';
import { CompetitionDetails } from '@herald/api-client/admin';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Confirmation } from '../../platform';
import { details, notReady, open, problem, ready, team, tournamentId } from './tournaments.testing';

type Answer = () => Observable<unknown>;

const closed = (start: CompetitionDetails, over: Parameters<typeof details>[0] = {}, config: Parameters<typeof details>[1] = {}) =>
  details({ publication: 'published', registration: 'closed', registrationChangedAt: '2026-11-20T17:00:00Z', revision: 4, schedulePublished: true, start, ...over }, config);

const running = (over: Partial<CompetitionDetails> = {}, config: Parameters<typeof details>[1] = {}) =>
  closed({ ...ready, startedAt: '2026-11-21T09:05:00Z', startedOnScheduleRevision: 1, ...over }, { competition: 'running', revision: 5 }, config);

async function render(reads: Answer[], starts: Answer[] = [], confirm: (question: Confirmation) => boolean = () => true) {
  const calls: number[] = [];
  const questions: Confirmation[] = [];
  const view = await open(
    `/${tournamentId}`,
    {
      getTournament: () => reads.shift()!(),
      startCompetition: (_o: string, _t: string, body: { expectedRevision: number }) => {
        calls.push(body.expectedRevision);
        return starts.shift()!();
      },
    },
    (question) => {
      questions.push(question);
      return confirm(question);
    },
  );
  await vi.waitFor(() => expect(view.page().querySelector('app-competition-area')).not.toBeNull());
  const area = () => view.page().querySelector<HTMLElement>('app-competition-area')!;
  const action = () => area().querySelector<HTMLButtonElement>('section > button');
  const badge = () => area().querySelector('#competition-state')?.textContent?.trim();
  const rows = () => [...area().querySelectorAll('.checks li')].map((li) => [li.querySelector('strong')?.textContent?.trim(), li.querySelector('herald-status-label')?.textContent?.trim()]);
  return { ...view, calls, questions, area, action, badge, rows };
}

describe('The competition area', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('lists every unmet condition with how to fix it and describes the disabled start by the first',
    { meta: { type: 'covers', description: 'competition-start: A tournament not yet ready' } }, async () => {
      const { area, action, badge, rows } = await render([
        () => of(details({ publication: 'published', registration: 'open', revision: 3, start: { ...notReady, eligible: 3, pending: 2, conditions: notReady.conditions.map((c) => ({ ...c, met: c.rule === 'two-eligible' })) } })),
      ]);
      expect(badge()).toBe('Registration is still open');
      expect(rows()).toEqual([
        ['Registration closed', 'Not met'],
        ['No entry pending check-in', 'Not met'],
        ['At least two eligible entrants', 'Met'],
        ['Schedule published and current', 'Not met'],
      ]);
      expect(area().textContent).toContain('2 entries pending. Check them in or mark them absent.');
      expect(area().textContent).toContain('No schedule published.');
      expect(action()!.disabled).toBe(true);
      expect(action()!.getAttribute('aria-describedby')).toBe('competition-state');

      const { violations } = await axe.run(area(), { rules: { 'color-contrast': { enabled: false } } });
      expect(violations.map((v) => v.id)).toEqual([]);
    });

  it('names a team outside its roster bounds and warns about a shared member name without blocking it', async () => {
    const start: CompetitionDetails = {
      ...ready,
      conditions: [...ready.conditions, { rule: 'rosters-within-bounds', met: false }],
      rostersOutsideBounds: [{ entryId: 'e-1', teamName: 'Harbour Lights', members: 2 }],
      sharedMemberNames: [{ name: 'Alex Kim', teamNames: ['River Falcons', 'North Stars'] }],
    };
    const { area, badge, rows } = await render([() => of(closed(start, {}, team))]);
    expect(badge()).toBe('Harbour Lights’ roster is below the minimum');
    expect(rows().at(-1)).toEqual(['Rosters within 3–5 players', 'Not met']);
    expect(area().textContent).toContain('Harbour Lights has 2 players (minimum 3).');
    expect(area().textContent).toContain('Warning, not a blocker: River Falcons and North Stars both have a member named “Alex Kim”.');
  });

  it('starts a ready tournament after a confirmation stating what start fixes',
    { meta: { type: 'covers', description: 'competition-start: The owner starts from the panel' } }, async () => {
      const { area, action, badge, calls, questions, settle, texts } = await render([() => of(closed(ready))], [() => of(running())]);
      expect(badge()).toBe('Ready to start');

      action()!.click();
      await settle();

      expect(questions[0].body).toBe('Start fixes the 4 entrants, schedule revision 1. It cannot be undone. No match starts by itself.');
      expect(calls).toEqual([4]);
      expect(badge()).toBe('Running');
      expect(area().textContent).toContain('Started 21 November 2026, 10:05 · Europe/Madrid');
      expect(area().textContent).toContain('Fixed at start: 4 entrants, schedule revision 1. No match has started.');
      expect(action()).toBeNull();
      expect(texts('.labels herald-status-label')).toContain('Running');
    });

  it('shows it is starting and does not start twice', async () => {
    const { action, badge, calls, settle, area } = await render([() => of(closed(ready))], [() => new Subject()]);
    action()!.click();
    await settle();
    expect(badge()).toBe('Starting');
    expect(area().querySelector('[role=status]')?.textContent?.trim()).toBe('Starting. Please wait; do not submit again.');
    action()!.click();
    await settle();
    expect(calls).toEqual([4]);
  });

  it('starts nothing when the confirmation is declined', async () => {
    const { action, calls, settle, badge } = await render([() => of(closed(ready))], [], () => false);
    action()!.click();
    await settle();
    expect(calls).toEqual([]);
    expect(badge()).toBe('Ready to start');
  });

  it('reports a conflict, keeps start unavailable and offers to reload the latest readiness', async () => {
    const { area, action, settle } = await render([() => of(closed(ready))], [() => throwError(() => problem(409, { currentRevision: 5 }))]);
    action()!.click();
    await settle();
    expect(area().querySelector('herald-notice strong')?.textContent).toBe('This tournament changed elsewhere');
    expect(action()!.disabled).toBe(true);
  });

  it('reports a frozen roster outside its bounds after the start', { meta: { type: 'covers', description: 'competition-start: A roster edit crossed the start' } }, async () => {
    const { area } = await render([() => of(running({ rostersOutsideBounds: [{ entryId: 'e-1', teamName: 'Harbour Lights', members: 2 }] }, team))]);
    expect(area().querySelector('herald-notice strong')?.textContent).toBe('A roster changed during the start');
    expect(area().textContent).toContain('Harbour Lights’ frozen roster has 2 players (minimum 3). Nothing was repaired');
  });
});
