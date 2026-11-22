import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CompetitionDetails, HeraldHostAdminService, TournamentConfiguration, TournamentDetails } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { AppContext, CONFIRM, Confirmation, confirmLeave, QUERY_CLIENT, Session } from '../../platform';
import { TournamentFormPage } from './tournament-form-page';
import { TournamentListPage } from './tournament-list-page';
import { TournamentReviewPage } from './tournament-review-page';

/** Test support for the feature's specs: the pages under the same addresses as in the application. */
export const organisation = '0198f000-0000-7000-8000-00000000000a';
export const tournamentId = '0198f000-0000-7000-8000-0000000000f1';
export const base = `/organisations/${organisation}/tournaments`;

export const configuration = (over: Partial<TournamentConfiguration> = {}): TournamentConfiguration => ({
  title: 'Autumn Open',
  gameVariant: 'Card game · Constructed',
  entryKind: 'individual',
  capacity: 16,
  minimumRosterSize: null,
  maximumRosterSize: null,
  activePlayersPerSide: null,
  registrationOpensAt: '2026-11-01T09:00:00',
  registrationClosesAt: '2026-11-13T18:00:00',
  plannedStartAt: '2026-11-14T10:00:00',
  timeZone: 'Europe/Madrid',
  location: 'onSite',
  venue: 'Northside Hall',
  admission: 'automatic',
  checkIn: 'optional',
  visibility: 'public',
  ...over,
});

export const team = { entryKind: 'team', minimumRosterSize: 3, maximumRosterSize: 5, activePlayersPerSide: 3 } as const;

/** Registration open, nothing reported yet. */
export const notReady: CompetitionDetails = {
  conditions: [
    { rule: 'registration-closed', met: false },
    { rule: 'no-pending-check-in', met: false },
    { rule: 'two-eligible', met: false },
    { rule: 'schedule-current', met: false },
  ],
  eligible: null,
  pending: null,
  rostersOutsideBounds: null,
  sharedMemberNames: [],
  publishedScheduleRevision: null,
  startedAt: null,
  startedOnScheduleRevision: null,
};

/** Four eligible players and schedule revision 1, built from the current field. */
export const ready: CompetitionDetails = {
  ...notReady,
  conditions: notReady.conditions.map((condition) => ({ ...condition, met: true })),
  eligible: 4,
  pending: 0,
  rostersOutsideBounds: [],
  publishedScheduleRevision: 1,
};

export const details = (over: Partial<TournamentDetails> = {}, config: Partial<TournamentConfiguration> = {}): TournamentDetails => ({
  id: tournamentId,
  revision: 1,
  publication: 'draft',
  registration: 'notOpen',
  competition: 'preparation',
  profile: 'singleRoundRobin-3-1-0',
  configuration: configuration(config),
  missingForPublication: [],
  missingForRegistration: [],
  registrationChangedAt: null,
  admittedEntries: 0,
  waitingEntries: 0,
  checkedInEntries: 0,
  schedulePublished: false,
  start: notReady,
  archived: false,
  cancellation: null,
  ...over,
});

export const problem = (status: number, body: object = {}) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });

export async function open(path: string, api: object, confirm: (options: Confirmation) => boolean | Promise<boolean> = () => true) {
  const client = new QueryClient();
  const routed = [
    { path: 'tournaments', component: TournamentListPage },
    { path: 'tournaments/new', component: TournamentFormPage, canDeactivate: [confirmLeave] },
    { path: 'tournaments/:tournamentId', component: TournamentFormPage, canDeactivate: [confirmLeave] },
    { path: 'tournaments/:tournamentId/review', component: TournamentReviewPage },
  ];
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId', children: routed }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: CONFIRM, useValue: confirm },
      { provide: HeraldHostAdminService, useValue: { getOrganisation: () => of({ id: organisation, name: 'Northside Gaming' }), ...api } },
    ],
  });
  const harness = await RouterTestingHarness.create(base + path);
  document.body.appendChild(harness.fixture.nativeElement);
  // The routed page changes when the address does, so it is read each time.
  const page = () => harness.routeNativeElement as HTMLElement;
  return {
    page,
    router: TestBed.inject(Router),
    settle: () => harness.fixture.whenStable(),
    text: (selector: string) => page().querySelector(selector)?.textContent?.trim(),
    texts: (selector: string) => [...page().querySelectorAll(selector)].map((e) => e.textContent?.trim()),
  };
}
