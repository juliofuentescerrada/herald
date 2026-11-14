import { organisationKey } from './app-context';

/** Query keys several features read and invalidate: one definition, so a write in one feature refreshes the others' reads. */
export const tournamentsKey = (organisation: string) => organisationKey(organisation, 'tournaments');
export const tournamentKey = (organisation: string, id: string) => organisationKey(organisation, 'tournament', id);
export const fieldKey = (organisation: string, id: string) => organisationKey(organisation, 'field', id);
export const scheduleKey = (organisation: string, id: string) => organisationKey(organisation, 'schedule', id);
