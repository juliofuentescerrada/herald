import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { base, details, open, problem, team, tournamentId } from './tournaments.testing';

async function render(reads: (() => Observable<unknown>)[], publications: (() => Observable<unknown>)[] = []) {
  const calls: { expectedRevision: number }[] = [];
  const view = await open(`/${tournamentId}/review`, {
    getTournament: () => reads.shift()!(),
    publishTournament: (_o: string, _t: string, body: { expectedRevision: number }) => {
      calls.push(body);
      return publications.shift()!();
    },
  });
  await vi.waitFor(() => expect(view.page().querySelector('dl')).not.toBeNull());
  const publish = () => view.page().querySelector<HTMLButtonElement>('button[herald-button]')!;
  return { ...view, calls, publish };
}

describe('Reviewing a tournament before publishing', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('summarises a team tournament in teams, with its roster bounds and the visibility in words', async () => {
    const { page, texts, publish } = await render([() => of(details({}, { ...team, visibility: 'unlisted' }))]);
    const summary = page().querySelector('.panel')!.textContent!;
    expect(texts('.panel h2')).toContain('Team structure');
    expect(summary).toContain('16 teams');
    expect(texts('dd')).toEqual(expect.arrayContaining(['3 players', '5 players', '14 November 2026, 10:00', 'On-site · Northside Hall']));
    expect(summary).toContain('Unlisted — anyone with the link can read it; it is not listed.');
    expect(summary).toContain('Publishing keeps registration not open. It creates no entries, pairings or play.');
    expect(summary).toContain('A published tournament cannot be unpublished.');
    expect(publish().textContent?.trim()).toBe('Publish tournament');
    expect(page().querySelectorAll('input, select, textarea')).toHaveLength(0);

    const { violations } = await axe.run(page(), { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('summarises an individual tournament without a team structure', async () => {
    const { page, texts } = await render([() => of(details())]);
    expect(texts('.panel h2')).not.toContain('Team structure');
    expect(page().textContent).toContain('16 individual entries');
    expect(texts('herald-status-label')).toEqual(['Draft', 'Registration not open', 'Preparing']);
  });

  it('publishes the reviewed revision and shows the published tournament, with nothing to start it', async () => {
    const published = details({ revision: 4, publication: 'published' });
    const { page, texts, text, publish, calls, router } = await render([() => of(details({ revision: 3 }))], [() => of(published)]);
    publish().click();
    await vi.waitFor(() => expect(router.url).toBe(`${base}/${tournamentId}`));
    expect(calls).toEqual([{ expectedRevision: 3 }]);
    await vi.waitFor(() => expect(text('h1')).toBe('Autumn Open'));
    expect(texts('herald-status-label')).toEqual(['Published', 'Registration not open', 'Preparing']);
    expect(page().textContent).not.toMatch(/start (the )?tournament/i);
  });

  it('shows it is publishing and does not publish twice', async () => {
    const { text, publish, calls, settle } = await render([() => of(details())], [() => new Subject()]);
    publish().click();
    await settle();
    expect(text('.panel [role="status"]')).toContain('Publishing');
    expect(publish().textContent?.trim()).toBe('Publishing…');
    publish().click();
    expect(calls).toHaveLength(1);
  });

  it('says a failed publication left a draft and offers to try again', async () => {
    const { text, texts, publish } = await render([() => of(details())], [() => throwError(() => problem(500))]);
    publish().click();
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('Tournament not published'));
    expect(publish().textContent?.trim()).toBe('Try again');
    expect(texts('herald-status-label')[0]).toBe('Draft');
  });

  it('shows the current configuration again when the tournament changed since the review opened', async () => {
    const { page, text, texts, publish, router } = await render(
      [() => of(details({ revision: 3 })), () => of(details({ revision: 4 }, { capacity: 32 }))],
      [() => throwError(() => problem(409, { currentRevision: 4 }))],
    );
    publish().click();
    await vi.waitFor(() => expect(text('herald-notice strong')).toBe('The tournament changed since you opened this review'));
    expect(page().textContent).toContain('32 individual entries');
    expect(texts('herald-status-label')[0]).toBe('Draft');
    expect(router.url).toBe(`${base}/${tournamentId}/review`);
  });

  it('does not offer publishing while values are missing', async () => {
    const { texts } = await render([() => of(details({ missingForPublication: ['timeZone'] }, { timeZone: null }))]);
    expect(texts('.actions a, .actions button')).toEqual(['Edit configuration']);
  });
});
