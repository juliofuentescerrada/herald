import { EntrantStatus, PairingsDetails, PlayerStatus, RoundState } from '@herald/api-client/admin';
import { IconName, StatusTone } from '@herald/ui';

interface Label {
  readonly text: string;
  readonly tone: StatusTone;
  readonly icon?: IconName;
}

/** States in words, never colour alone; only departures and sanctions take an icon, alert-triangle (attention required, docs/ui/icons.md). */
export const roundStateLabel: Record<RoundState, Label> = {
  notStarted: { text: 'Not started', tone: 'neutral' },
  running: { text: 'Running', tone: 'info' },
  completed: { text: 'Completed', tone: 'success' },
};

export const entrantStatusLabel: Record<EntrantStatus, Label> = {
  active: { text: 'Active', tone: 'success' },
  withdrawn: { text: 'Withdrawn', tone: 'danger', icon: 'alert-triangle' },
  disqualified: { text: 'Disqualified', tone: 'danger', icon: 'alert-triangle' },
};

export const playerStatusLabel: Record<PlayerStatus, Label> = {
  available: { text: 'Available', tone: 'success' },
  withdrawn: { text: 'Withdrawn', tone: 'danger', icon: 'alert-triangle' },
  sanctioned: { text: 'Sanctioned', tone: 'danger', icon: 'alert-triangle' },
};

/** Shared with the tournaments and entries features, so a write here refreshes their reads. */
export { fieldKey, scheduleKey, standingsKey, tournamentKey } from '../../platform';

/** "4 players · 3 rounds · 6 matches": the size of a set of pairings in words. */
export const sizeText = (pairings: PairingsDetails, teams: boolean): string => {
  const entrants = `${pairings.entrants} ${teams ? (pairings.entrants === 1 ? 'team' : 'teams') : pairings.entrants === 1 ? 'player' : 'players'}`;
  return `${entrants} · ${pairings.rounds.length} ${pairings.rounds.length === 1 ? 'round' : 'rounds'} · ${pairings.matches} ${pairings.matches === 1 ? 'match' : 'matches'}`;
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
    case 'schedule/competition-started': return 'The competition has started.';
    case 'draft/none': return 'There is no draft to publish.';
    case 'draft/stale': return 'The field changed after this draft. Regenerate it first.';
    case 'entrant/departed': return 'This entrant has already left the competition.';
    case 'entrant/unknown': return 'This entrant is not in the running competition.';
    case 'schedule/not-started': return 'The competition has not started.';
    case 'competition/finalised': return 'The competition is finalised. Reopen it with a reason first, from the Standings page.';
    case 'player/not-on-roster': return 'This player is not on the team’s frozen roster.';
    case 'player/withdrawn': return 'This player has withdrawn from the tournament.';
    case 'player/not-sanctioned': return 'This player has no sanction to lift.';
    case 'reason/required': return 'Enter a reason.';
    case 'reason/too-long': return 'Use at most 500 characters.';
    default: return 'Check the request and try again.';
  }
};
