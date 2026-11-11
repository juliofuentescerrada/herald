import { EntryDetails, FieldDetails } from '@herald/api-client/admin';
import { organisationKey } from '../../platform';

/** The same keys as the tournaments feature uses, so a write here refreshes its tournament and list. */
export const tournamentKey = (organisation: string, id: string) => organisationKey(organisation, 'tournament', id);
export const tournamentsKey = (organisation: string) => organisationKey(organisation, 'tournaments');
export const fieldKey = (organisation: string, id: string) => organisationKey(organisation, 'field', id);
export const guestsKey = (organisation: string) => organisationKey(organisation, 'guests');

/** A guest's kind follows the tournament's entry kind: players for individual entries, teams for team entries. */
export const guestKind = (field: FieldDetails) => (field.terms.entryKind === 'team' ? 'team' : 'player');

export const waitingReasonText = (entry: EntryDetails): string => (entry.waitingReason === 'admissionPending' ? 'Admission pending' : 'Capacity full');

/** The first entry waiting for a slot: admitting any other one skips the capacity queue (EN-7). */
export const firstInQueue = (field: FieldDetails) => field.entries.find((entry) => entry.state === 'waiting' && entry.waitingReason === 'capacityFull');

export const hasMismatch = (field: FieldDetails) => field.overCapacityBy > 0 || field.kindMismatch;

export const hasFreeSlot = (field: FieldDetails) => !hasMismatch(field) && field.admitted < field.terms.capacity;

/** What a cancellation does to the waiting list (EN-8), said before it is confirmed. */
export const cancellationEffect = (field: FieldDetails, entry: EntryDetails): string => {
  if (entry.state === 'waiting') return 'No slot is freed by cancelling a waiting entry. No waiting entry will be admitted.';
  if (field.terms.admission === 'manual') return 'No waiting entry will be admitted automatically because admission is manual.';
  if (field.terms.registration !== 'open') {
    return 'No waiting entry will be admitted automatically because registration is not open. You can admit a waiting entry afterwards.';
  }
  if (field.kindMismatch) return 'No waiting entry will be admitted automatically while the field has entries of the other kind.';
  if (field.overCapacityBy > 0) return 'The field stays full after this cancellation, so no waiting entry will be admitted.';
  const next = firstInQueue(field);
  return next ? `${next.guestName}, first in the capacity queue, will be admitted automatically.` : 'No waiting entry is available to admit.';
};

/** The API's rule codes in words; the API applies the rules, the page only reports them. */
export const ruleText = (field: string, rule: string): string => {
  switch (`${field}/${rule}`) {
    case 'registration/not-open': return 'Registration is not open, so entries cannot be added.';
    case 'guest/kind': return 'This guest is of the other kind from the tournament’s entries.';
    case 'guest/already-entered': return 'This guest already has an active entry in this tournament.';
    case 'field/mismatch': return 'The field has a mismatch to resolve first.';
    case 'capacity/full': return 'No slot is free.';
    case 'entry/cancelled': return 'This entry was cancelled.';
    case 'reason/required': return 'Enter a private reason.';
    case 'reason/too-long': return 'Use at most 500 characters.';
    case 'name/required': return 'Enter a name.';
    case 'name/too-long': return 'Use at most 80 characters.';
    default: return 'Check the request and try again.';
  }
};
