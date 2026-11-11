import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AppContext, organisationKey, organisationPath } from '../../platform';

export { admittedText, capacityText, dateTimeText, instantText, lifecycleLabels, locationText, registrationText } from '../../shared';

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
