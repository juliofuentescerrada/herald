import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ChangeLogItem, HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { Observable, of, throwError } from 'rxjs';
import { AccessState, AppContext, QUERY_CLIENT, Session } from '../../platform';
import { ChangeLogPage } from './change-log-page';

const organisation = '0198f000-0000-7000-8000-00000000000a';
const tournamentId = '0198f000-0000-7000-8000-0000000000f1';

const tournament = {
  id: tournamentId,
  revision: 6,
  publication: 'published',
  configuration: { title: 'Saturday Open', timeZone: 'Europe/Madrid', visibility: 'public' },
} as TournamentDetails;

const item = (over: Partial<ChangeLogItem>): ChangeLogItem => ({
  kind: 'tournamentPublished',
  subject: tournamentId,
  subjectRevision: 2,
  actorName: 'Alex Morgan',
  at: '2026-11-15T08:00:00Z',
  changes: [],
  timeZone: null,
  alias: null,
  cause: null,
  reason: null,
  public: true,
  ...over,
});

// The prototype's populated log, newest first (h1-change-log Visual input, log-populated).
const populated: ChangeLogItem[] = [
  item({ kind: 'tournamentCancelled', subjectRevision: 9, at: '2026-11-23T14:20:00Z', reason: 'Venue unavailable' }),
  item({
    kind: 'datesChanged', subjectRevision: 8, at: '2026-11-20T08:30:00Z', timeZone: 'Europe/Madrid',
    changes: [{ field: 'plannedStartAt', old: '2026-11-22T10:00:00', new: '2026-11-29T10:00:00' }],
  }),
  item({ kind: 'schedulePublished', subjectRevision: 2, at: '2026-11-19T18:05:00Z', public: false }),
  item({ kind: 'scheduleWithdrawn', subjectRevision: 1, at: '2026-11-19T17:40:00Z', cause: 'operator', public: false }),
  item({ kind: 'entryAdmitted', subject: 'e-taylor', subjectRevision: 1, at: '2026-11-17T11:10:00Z', alias: 'Taylor Finch', cause: 'operator', public: false }),
  item({ kind: 'materialChange', subjectRevision: 3, at: '2026-11-16T09:00:00Z', changes: [{ field: 'venue', old: 'Madrid', new: 'Valencia' }] }),
  item({}),
];

async function open(log: () => Observable<ChangeLogItem[]>, details: TournamentDetails = tournament) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/tournaments/:tournamentId/change-log', component: ChangeLogPage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null) } },
      { provide: HeraldHostAdminService, useValue: { getTournament: () => of(details), getChangeLog: log } },
    ],
  });
  const harness = await RouterTestingHarness.create(`/organisations/${organisation}/tournaments/${tournamentId}/change-log`);
  document.body.appendChild(harness.fixture.nativeElement);
  const page = () => harness.routeNativeElement as HTMLElement;
  await vi.waitFor(() => expect(page().querySelector('[role="status"]')?.textContent ?? '').not.toContain('Loading'));
  await harness.fixture.whenStable();
  return {
    page,
    harness,
    text: (selector: string) => page().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim(),
    texts: (selector: string) => [...page().querySelectorAll(selector)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()),
    button: (text: string) => [...page().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!,
  };
}

const violations = async (page: HTMLElement) => (await axe.run(page, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

describe('The change log page', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('lists the changes newest first with who, when and the Public label', async () => {
    const { page, texts, text } = await open(() => of(populated));

    expect(texts('.log li p:first-child')).toEqual([
      'Tournament cancelled · Reason: Venue unavailable',
      'Planned start changed from 22 November 2026, 10:00 to 29 November 2026, 10:00 · Europe/Madrid',
      'Schedule revision 2 published',
      'Schedule revision 1 withdrawn · withdrawal reason in the publication history',
      'Taylor Finch admitted · admission reason in the entries',
      'Venue changed from Madrid to Valencia',
      'Tournament published',
    ]);
    expect(texts('.log li p.help')[1]).toBe('Alex Morgan · 20 November 2026, 09:30 · Europe/Madrid');
    expect(texts('.log li herald-status-label')).toEqual(['Public', 'Public', 'Public', 'Public']);
    expect(text('nav a[aria-current="page"]')).toBe('Change log');
    expect(page().querySelector<HTMLAnchorElement>('.log a')?.getAttribute('href')).toBe(`/organisations/${organisation}/tournaments/${tournamentId}/schedule`);
    expect(text('.column > p.help')).toContain('it does not send them');
    expect(await violations(page())).toEqual([]);
  });

  it('shows only the schedule\'s publications and withdrawals when filtered by Schedule',
    { meta: { type: 'covers', description: 'change-log: Filtering' } }, async () => {
      const { page, texts, button, harness } = await open(() => of(populated));

      button('Schedule').click();
      await harness.fixture.whenStable();

      expect(texts('.log li p:first-child')).toEqual(['Schedule revision 2 published', 'Schedule revision 1 withdrawn · withdrawal reason in the publication history']);
      expect(button('Schedule').getAttribute('aria-pressed')).toBe('true');
      expect(button('All').getAttribute('aria-pressed')).toBe('false');
      expect(await violations(page())).toEqual([]);
    });

  it('labels no row Public on a private tournament, whose page visitors cannot read', async () => {
    const { page } = await open(() => of(populated), { ...tournament, configuration: { ...tournament.configuration, visibility: 'private' } });

    expect(page().querySelectorAll('.log li').length).toBe(7);
    expect(page().querySelector('herald-status-label')).toBeNull();
  });

  it('says changes appear from publication onwards when there are none', async () => {
    const { page, text } = await open(() => of([]));

    expect(text('herald-notice')).toContain('No changes yet');
    expect(text('herald-notice')).toContain('Changes appear here from publication onwards');
    expect(page().querySelector('.filter')).toBeNull();
    expect(await violations(page())).toEqual([]);
  });

  it('reports a load failure and reads again on Try again', async () => {
    const log = vi.fn<() => Observable<ChangeLogItem[]>>(() => throwError(() => new HttpErrorResponse({ status: 500 })));
    const { page, text, button, harness } = await open(log);

    expect(text('herald-notice')).toContain('The change log could not be loaded');
    log.mockReturnValue(of(populated));
    button('Try again').click();
    await vi.waitFor(() => expect(page().querySelectorAll('.log li').length).toBe(7));
    await harness.fixture.whenStable();
    expect(await violations(page())).toEqual([]);
  });
});
