import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeraldHostAdminService, TournamentConfiguration, TournamentDetails } from '@herald/api-client/admin';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AppContext, organisationKey, organisationPath } from '../../platform';

/** Query keys under the organisation, so a change of organisation or person drops them with the rest. */
export const tournamentsKey = (organisation: string) => organisationKey(organisation, 'tournaments');
export const tournamentKey = (organisation: string, id: string) => organisationKey(organisation, 'tournament', id);

export const tournamentsPath = (organisation: string) => `${organisationPath(organisation)}/tournaments`;

/** The working organisation of a tournaments page: its route sits under one. */
export const injectOrganisation = () => inject(AppContext).organisation()!;

/** The tournament in the address; never asked for on the page that creates one. */
export const injectTournament = (organisation: string) => {
  const api = inject(HeraldHostAdminService);
  const id = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId');
  return injectQuery(() => ({
    queryKey: tournamentKey(organisation, id ?? 'new'),
    queryFn: () => firstValueFrom(api.getTournament<TournamentDetails>(organisation, id!)),
    enabled: id !== null,
    retry: false,
    // A form holds what was loaded: a refetch behind it would only compete with the revision checks.
    staleTime: Infinity,
  }));
};

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });

/** "14 November 2026, 10:00" for a local date-time, whatever the browser's locale and zone (V-3). */
export const dateTimeText = (local: string | null | undefined): string => {
  const at = local ? new Date(`${local.slice(0, 16)}:00Z`) : null;
  return at && !Number.isNaN(at.getTime()) ? `${day.format(at)}, ${time.format(at)}` : '';
};

/** Capacity counts entries: "16 teams" is never "16 players" (F-02). */
export const capacityText = (configuration: Pick<TournamentConfiguration, 'capacity' | 'entryKind'>): string => {
  const { capacity, entryKind } = configuration;
  if (capacity == null) return 'Capacity not set';
  if (entryKind === 'team') return `${capacity} teams`;
  return entryKind === 'individual' ? `${capacity} individual entries` : `${capacity} entries`;
};

export const locationText = (configuration: Pick<TournamentConfiguration, 'location' | 'venue'>): string =>
  configuration.location === 'online' ? 'Online' : (configuration.venue ?? (configuration.location === 'onSite' ? 'On-site' : ''));

/** Publication, registration and competition are three facts, never one "Active" label. */
export const lifecycleLabels = (tournament: { publication: string; registration: string; competition: string }): string[] => [
  tournament.publication === 'published' ? 'Published' : 'Draft',
  tournament.registration === 'notOpen' ? 'Registration not open' : tournament.registration,
  tournament.competition === 'preparation' ? 'Preparing' : tournament.competition,
];

export const profileText = 'Single round-robin · 3 / 1 / 0';

export const visibilityText: Record<string, string> = {
  public: 'Public — listed, and anyone can read it.',
  unlisted: 'Unlisted — anyone with the link can read it; it is not listed.',
  private: 'Private — only this organisation’s owner can read private content. A link alone grants no access.',
};

export const fieldLabels: Record<string, string> = {
  title: 'Title',
  gameVariant: 'Game / variant',
  entryKind: 'Entry kind',
  capacity: 'Capacity',
  minimumRosterSize: 'Minimum roster size',
  maximumRosterSize: 'Maximum roster size',
  activePlayersPerSide: 'Active players per side',
  registrationOpensAt: 'Registration opening',
  registrationClosesAt: 'Registration closure',
  plannedStartAt: 'Planned start',
  timeZone: 'Reference time zone',
  location: 'Location mode',
  venue: 'Venue',
  admission: 'Admission',
  checkIn: 'Check-in',
  visibility: 'Visibility',
};
