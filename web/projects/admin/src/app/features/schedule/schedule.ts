import { PairingsDetails } from '@herald/api-client/admin';
import { organisationKey } from '../../platform';

/** The same keys as the tournaments and entries features use, so a write here refreshes their reads. */
export const tournamentKey = (organisation: string, id: string) => organisationKey(organisation, 'tournament', id);
export const fieldKey = (organisation: string, id: string) => organisationKey(organisation, 'field', id);
export const scheduleKey = (organisation: string, id: string) => organisationKey(organisation, 'schedule', id);

/** "4 players · 3 rounds · 6 matches": the size of a set of pairings in words. */
export const sizeText = (pairings: PairingsDetails, teams: boolean): string => {
  const entrants = `${pairings.entrants} ${teams ? (pairings.entrants === 1 ? 'team' : 'teams') : pairings.entrants === 1 ? 'player' : 'players'}`;
  return `${entrants} · ${pairings.rounds.length} rounds · ${pairings.matches} matches`;
};

export const seedingText = (pairings: PairingsDetails): string =>
  pairings.seeding === 'draw' ? `Draw · seed ${pairings.seed}` : 'Admission order';

/** Why a draft cannot be generated now, each with where it is fixed (round-robin-pairings). */
export const blockerText: Record<string, { readonly condition: string; readonly fix: string; readonly where: 'configuration' | 'entries' }> = {
  'registration-not-closed': { condition: 'Registration closed', fix: 'Close registration on the configuration page.', where: 'configuration' },
  'entries-pending': { condition: 'No entry pending check-in', fix: 'Check each pending entry in, or mark it absent, on the entries page.', where: 'entries' },
  'entrants-fewer-than-two': { condition: 'At least two eligible entrants', fix: 'Admit and check in at least two entries.', where: 'entries' },
};

/** The API's rule codes in words; the API applies the rules, the page only reports them. */
export const ruleText = (field: string, rule: string): string => {
  switch (`${field}/${rule}`) {
    case 'registration/not-closed': return 'Registration is not closed.';
    case 'entries/pending': return 'Some entries are still pending check-in.';
    case 'entrants/fewer-than-two': return 'At least two eligible entrants are needed.';
    case 'schedule/published': return 'A schedule is published. Withdraw it first.';
    case 'schedule/not-published': return 'No schedule is published.';
    case 'draft/none': return 'There is no draft to publish.';
    case 'draft/stale': return 'The field changed after this draft. Regenerate it first.';
    case 'reason/required': return 'Enter a reason.';
    case 'reason/too-long': return 'Use at most 500 characters.';
    default: return 'Check the request and try again.';
  }
};
