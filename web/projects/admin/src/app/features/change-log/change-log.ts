import { ChangedValue, ChangeKind, ChangeLogItem } from '@herald/api-client/admin';
import { IconName } from '@herald/ui';
import { dateTimeText } from '../../shared';

/** The filter's groups, in the prototype's order (h1-change-log D-4). */
export const groups = ['All', 'Entries', 'Schedule', 'Tournament', 'Results'] as const;
export type Group = (typeof groups)[number];

const groupOf: Record<ChangeKind, Exclude<Group, 'All'>> = {
  entryAdmitted: 'Entries',
  entryCancelled: 'Entries',
  schedulePublished: 'Schedule',
  scheduleWithdrawn: 'Schedule',
  tournamentPublished: 'Tournament',
  materialChange: 'Tournament',
  datesChanged: 'Tournament',
  visibilityChanged: 'Tournament',
  tournamentCancelled: 'Tournament',
  competitionFinalised: 'Results',
  competitionReopened: 'Results',
};

const icons: Record<Exclude<Group, 'All'>, IconName> = { Entries: 'users', Schedule: 'calendar', Tournament: 'trophy', Results: 'list-numbers' };

export const inGroup = (item: ChangeLogItem, group: Group): boolean => group === 'All' || groupOf[item.kind] === group;

export const iconOf = (item: ChangeLogItem): IconName => icons[groupOf[item.kind]];

const fieldWords: Record<string, string> = {
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

const causeWords: Record<string, string> = { 'tournament-cancelled': 'tournament cancelled', 'absent-at-start': 'absent at start', promotion: 'from the queue' };

/** An enum value or a date in words: "OnSite" → "on site", "2026-11-22T10:00:00" → "22 November 2026, 10:00". */
const valueText = (field: string, value: string | null): string => {
  if (value == null || value === '') return 'none';
  if (field.endsWith('At')) return dateTimeText(value);
  if (['entryKind', 'location', 'visibility'].includes(field)) return value.replace(/(?!^)[A-Z]/g, (letter) => ` ${letter}`).toLowerCase();
  return value;
};

/** "Venue changed from Madrid to Valencia"; a value set for the first time, or removed, says so. */
const changeText = (change: ChangedValue): string => {
  const field = fieldWords[change.field] ?? change.field;
  if (change.old == null) return `${field} set to ${valueText(change.field, change.new)}`;
  if (change.new == null) return `${field} removed (was ${valueText(change.field, change.old)})`;
  return `${field} changed from ${valueText(change.field, change.old)} to ${valueText(change.field, change.new)}`;
};

/** What changed, in one sentence; a reason given in Tournaments follows it, one given elsewhere is linked from the page (Q1). */
export const sentence = (item: ChangeLogItem): string => {
  const cause = item.cause && causeWords[item.cause] ? ` · ${causeWords[item.cause]}` : '';
  switch (item.kind) {
    case 'entryAdmitted': return `${item.alias} admitted${cause}`;
    case 'entryCancelled': return `${item.alias} cancelled${cause}`;
    case 'schedulePublished': return `Schedule revision ${item.subjectRevision} published`;
    case 'scheduleWithdrawn': return `Schedule revision ${item.subjectRevision} withdrawn`;
    case 'tournamentPublished': return 'Tournament published';
    case 'datesChanged': return `${item.changes.map(changeText).join('; ')}${item.timeZone ? ` · ${item.timeZone}` : ''}`;
    case 'materialChange':
    case 'visibilityChanged': return item.changes.map(changeText).join('; ');
    case 'tournamentCancelled': return `Tournament cancelled${item.reason ? ` · Reason: ${item.reason}` : ''}`;
    case 'competitionFinalised':
      return item.subjectRevision === 1 ? 'Final standings (final revision 1)' : `Final standings revised (final revision ${item.subjectRevision})`;
    case 'competitionReopened': return `Competition reopened after final revision ${item.subjectRevision}`;
  }
};

/** Where another module keeps the reason it does not share (Q1): the schedule's publication history or the final revisions. */
export const reasonLink = (item: ChangeLogItem): { path: string; text: string } | null =>
  item.kind === 'scheduleWithdrawn' ? { path: '../schedule', text: 'withdrawal reason in the publication history' }
    : item.kind === 'competitionReopened' ? { path: '../standings', text: 'reopening reason with the final revisions' }
      : null;
