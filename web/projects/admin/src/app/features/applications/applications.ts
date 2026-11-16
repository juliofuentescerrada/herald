import { GrantDetails, OperationGroup } from '@herald/api-client/admin';
import { organisationKey } from '../../platform';

export const grantsKey = (organisation: string) => organisationKey(organisation, 'grants');

/** The operation groups an owner can grant, in the form's order, with what each covers (pilot-access design D-3, N-2). */
export const groups: readonly { group: OperationGroup; label: string; covers: string }[] = [
  { group: 'read', label: 'Read', covers: 'tournaments, entries, schedule, results and standings' },
  { group: 'setup', label: 'Tournament setup', covers: 'create, configure, publish, registration window' },
  { group: 'entries', label: 'Entries', covers: 'guests, entries, admission, check-in, rosters' },
  { group: 'schedule', label: 'Schedule', covers: 'generate, publish and withdraw, start' },
  { group: 'results', label: 'Results and corrections', covers: 'lineups, results, outcomes, departures' },
  { group: 'finalisation', label: 'Finalisation', covers: 'finalise and reopen' },
];

export const groupLabel = (group: OperationGroup): string => groups.find((other) => other.group === group)?.label ?? group;

/** "All tournaments", or the granted tournaments' titles; a tournament no longer listed keeps a plain placeholder. */
export const scopeText = (grant: GrantDetails, titles: ReadonlyMap<string, string>): string =>
  grant.tournaments ? grant.tournaments.map((id) => titles.get(id) ?? 'Unknown tournament').join(', ') : 'All tournaments';

/** An application identifier as the provisioning record gives it: a GUID with hyphens. */
export const identifierPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** When a grant changed, in the viewer's own time: the page is organisation-wide, not one tournament's zone. */
export const whenText = (instant: string): string => {
  const at = new Date(instant);
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(at);
  const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  return `${date}, ${clock}`;
};
