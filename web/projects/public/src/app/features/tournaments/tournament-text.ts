import { PublicChange, PublicLine, PublicMatch, PublicStandings, PublicTournamentView } from '@herald/api-client/public';
import type { IconName, StatusTone } from '@herald/ui';

/** How the public page writes a tournament's facts, in words and the tournament's own time zone (h1-public-read D-5). */

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });

/** "22 November 2026, 10:00" for a local date-time of the reference time zone. */
export const localText = (local: string | null | undefined): string => {
  const at = local ? new Date(`${local.slice(0, 16)}:00Z`) : null;
  return at && !Number.isNaN(at.getTime()) ? `${day.format(at)}, ${time.format(at)}` : '';
};

/** An instant in the tournament's reference time zone, with the zone: "22 November 2026, 11:40 Europe/Madrid". */
export const instantText = (instant: string, zone: string | null): string => {
  const options = { timeZone: zone ?? 'UTC' } as const;
  const at = new Date(instant);
  const date = new Intl.DateTimeFormat('en-GB', { ...options, day: 'numeric', month: 'long', year: 'numeric' }).format(at);
  const clock = new Intl.DateTimeFormat('en-GB', { ...options, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  return `${date}, ${clock} ${zone ?? 'UTC'}`;
};

export interface Label {
  readonly text: string;
  readonly icon?: IconName;
  readonly tone?: StatusTone;
}

const registration: Record<string, Label> = {
  notOpen: { text: 'Registration not open', icon: 'clock' },
  open: { text: 'Registration open', icon: 'door-enter' },
  closed: { text: 'Registration closed', icon: 'lock' },
};

/** Registration and competition are separate facts, each its own label (visual direction §6.1). */
export const lifecycleLabels = (page: PublicTournamentView): Label[] => [
  registration[page.registration] ?? { text: page.registration },
  page.competition === 'running' ? { text: 'Running', icon: 'trophy', tone: 'info' }
    : page.competition === 'finalised' ? { text: 'Finalised', tone: 'success' }
    : page.competition === 'cancelled' ? { text: 'Cancelled', tone: 'danger' }
    : { text: 'Preparing', icon: 'hourglass' },
];

/** "Individual · single round-robin", or "Teams of 5 to 7 · 5 play each match · single round-robin". */
export const formatText = (page: PublicTournamentView): string =>
  page.entryKind === 'team'
    ? `Teams of ${page.minimumRosterSize} to ${page.maximumRosterSize} · ${page.activePlayersPerSide} play each match · single round-robin`
    : 'Individual · single round-robin';

export const venueText = (page: PublicTournamentView): string =>
  page.location === 'online' ? 'Online' : (page.venue ?? (page.location === 'onSite' ? 'On-site' : 'Not set'));

/** A match's state in words with its tone; a voided match says so (D-25). */
export const matchState = (match: PublicMatch): Label =>
  match.cause === 'voidedCancelled' ? { text: 'Voided', tone: 'danger' }
    : match.state === 'resolved' ? { text: 'Resolved', tone: 'success' }
    : match.state === 'inPlay' ? { text: 'In play', tone: 'info' }
    : { text: 'Scheduled' };

/** A resolved match's result in words, never as a score, and without the organisation's reasons (D-2). */
export const outcomeText = (match: PublicMatch): string => {
  if (match.state !== 'resolved') return '';
  const winner = match.outcome === 'first' ? match.first : match.second;
  const loser = match.outcome === 'first' ? match.second : match.first;
  switch (match.cause) {
    case 'concession': return `${loser} conceded · ${winner} wins`;
    case 'singleAbsence': return `${loser} was absent · ${winner} wins`;
    case 'doubleAbsence': return 'Both were absent · 0 each';
    case 'noContest': return 'No contest · 0 each';
    case 'voidedCancelled': return 'Voided: tournament cancelled · no points';
    default: return match.outcome === 'draw' ? 'Draw' : `${winner} won`;
  }
};

const results: Record<string, string> = { won: 'won', drawn: 'draw', lost: 'lost', noWinner: 'no winner' };

const causeText = (cause: string): string => cause.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);

export const pointsText = (points: number): string => `${points} ${points === 1 ? 'point' : 'points'}`;

/** "Round 1 · vs Jamie Brook · draw · played · 1 point", or "Round 2 · Rest · no points". */
export const lineText = (line: PublicLine): string =>
  line.opponent
    ? `Round ${line.round} · vs ${line.opponent} · ${results[line.result ?? ''] ?? ''} · ${causeText(line.cause ?? '')} · ${pointsText(line.points)}`
    : `Round ${line.round} · Rest · no points`;

/** "Provisional · results revision 9 · updated 22 November 2026, 11:40 Europe/Madrid", or the final revision (D-5). */
export const standingsHeader = (standings: PublicStandings, zone: string | null, cancelled: boolean): string => {
  if (cancelled) return 'Cancelled · no champion or final ranking';
  if (standings.final) return `Final · final revision ${standings.finalRevision}${standings.revised ? ' (revised after reopening)' : ''} · updated ${instantText(standings.updatedAt, zone)}`;
  return `Provisional · results revision ${standings.resultsRevision} · updated ${instantText(standings.updatedAt, zone)}`;
};

const fields: Record<string, string> = {
  gameVariant: 'Game or variant',
  entryKind: 'Entry kind',
  minimumRosterSize: 'Minimum roster size',
  maximumRosterSize: 'Maximum roster size',
  activePlayersPerSide: 'Active players per side',
  location: 'Location',
  venue: 'Venue',
  visibility: 'Visibility',
  registrationOpensAt: 'Registration opening',
  registrationClosesAt: 'Registration closing',
  plannedStartAt: 'Planned start',
};

const valueText = (field: string, value: string | null): string => {
  if (value == null || value === '') return 'none';
  if (field.endsWith('At')) return localText(value);
  if (['entryKind', 'location', 'visibility'].includes(field)) return value.replace(/(?!^)[A-Z]/g, (letter) => ` ${letter}`).toLowerCase();
  return value;
};

/** A public change in one sentence; reasons never reach the page (h1-change-log N-5). */
export const changeText = (change: PublicChange): string => {
  const values = change.changes
    .map((value) => `${fields[value.field] ?? value.field} ${value.old == null ? 'set to' : `changed from ${valueText(value.field, value.old)} to`} ${valueText(value.field, value.new)}`)
    .join('; ');
  switch (change.kind) {
    case 'tournamentPublished': return 'Tournament published';
    case 'tournamentCancelled': return 'Tournament cancelled';
    case 'competitionFinalised':
      return change.subjectRevision === 1 ? 'Final standings (final revision 1)' : `Final standings revised (final revision ${change.subjectRevision})`;
    case 'datesChanged': return `${values}${change.timeZone ? ` · ${change.timeZone}` : ''}`;
    default: return values;
  }
};

/** Final standings are results; every other public change is the tournament's own (h1-change-log D-4's groups). */
export const changeIcon = (change: PublicChange): IconName => (change.kind === 'competitionFinalised' ? 'list-numbers' : 'trophy');
