import type { IconName } from '@herald/ui';

/** How the admin application writes a tournament's facts, shared by the features that show a tournament. */

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });

/** "14 November 2026, 10:00" for a local date-time, whatever the browser's locale and zone (V-3). */
export const dateTimeText = (local: string | null | undefined): string => {
  const at = local ? new Date(`${local.slice(0, 16)}:00Z`) : null;
  return at && !Number.isNaN(at.getTime()) ? `${day.format(at)}, ${time.format(at)}` : '';
};

/** An instant written in the tournament's reference time zone, in the same form as `dateTimeText`. */
export const instantText = (instant: string, zone: string): string => {
  const at = new Date(instant);
  const options = { timeZone: zone } as const;
  const date = new Intl.DateTimeFormat('en-GB', { ...options, day: 'numeric', month: 'long', year: 'numeric' }).format(at);
  const clock = new Intl.DateTimeFormat('en-GB', { ...options, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  return `${date}, ${clock}`;
};

/** Capacity counts entries: "16 teams" is never "16 players" (F-02). */
export const capacityText = (configuration: { capacity?: number | null; entryKind?: string | null }): string => {
  const { capacity, entryKind } = configuration;
  if (capacity == null) return 'Capacity not set';
  if (entryKind === 'team') return `${capacity} teams`;
  return entryKind === 'individual' ? `${capacity} individual entries` : `${capacity} entries`;
};

/** "3 of 8 individual entries": the admitted entries against the capacity in its unit. */
export const admittedText = (admitted: number, configuration: { capacity?: number | null; entryKind?: string | null }): string =>
  `${admitted} of ${capacityText(configuration)}`;

export const locationText = (configuration: { location?: string | null; venue?: string | null }): string =>
  configuration.location === 'online' ? 'Online' : (configuration.venue ?? (configuration.location === 'onSite' ? 'On-site' : ''));

const registrationWords: Record<string, string> = { notOpen: 'Registration not open', open: 'Registration open', closed: 'Registration closed' };
export const registrationText = (registration: string): string => registrationWords[registration] ?? registration;

export interface LifecycleLabel {
  readonly text: string;
  readonly icon?: IconName;
}

const registrationIcons: Record<string, IconName> = { notOpen: 'clock', open: 'door-enter', closed: 'lock' };

/** Publication, registration and competition are three facts, never one "Active" label; each icon follows its meaning (ui-icons D-1). */
export const lifecycleLabels = (tournament: { publication: string; registration: string; competition: string }): LifecycleLabel[] => [
  tournament.publication === 'published' ? { text: 'Published', icon: 'world' } : { text: 'Draft', icon: 'pencil' },
  { text: registrationText(tournament.registration), icon: registrationIcons[tournament.registration] },
  tournament.competition === 'preparation' ? { text: 'Preparing', icon: 'hourglass' } : { text: tournament.competition },
];
