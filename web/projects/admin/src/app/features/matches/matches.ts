import { organisationKey } from '../../platform';
import { possessive } from '../../shared';

/** Shared with the schedule feature, so starting a match refreshes the schedule's states. */
export { scheduleKey, standingsKey, tournamentKey } from '../../platform';

export const matchKey = (organisation: string, tournamentId: string, matchId: string) => organisationKey(organisation, 'match', tournamentId, matchId);

export { possessive };

/** A blocker code from the API ("second-lineup-missing") as its field and rule. */
export const splitBlocker = (code: string): [string, string] => {
  const field = ['first-lineup', 'second-lineup', 'first-roster', 'second-roster', 'players', 'roster'].find((name) => code.startsWith(`${name}-`)) ?? '';
  return [field, code.slice(field.length + 1)];
};

/** The API's rule codes in words, naming the side's team; the API applies the rules, the page only reports them. */
export const ruleText = (field: string, rule: string, required: number | null, first: string, second: string, unavailable: readonly string[] = []): string => {
  if (field === 'competition' && rule === 'finalised') return 'The competition is finalised. Reopen it with a reason first, from the Standings page.';
  if (field === 'outcome') return 'Choose one of the outcomes offered.';
  if (field === 'reason') return rule === 'too-long' ? 'The reason can have at most 500 characters.' : 'A no contest needs a reason.';
  if (field === 'correction-reason') return rule === 'too-long' ? 'The reason for the correction can have at most 500 characters.' : 'Give a reason for the correction.';
  if (field === 'played' && rule === 'recorded') return 'Play was recorded: choose a played result, a concession after play or a no contest after play.';
  if (field === 'resolution') return 'That is the current result: there is nothing to correct.';
  if (field === 'entrant' || field === 'played' || field === 'cause') return 'Complete the chosen cause’s answers.';
  const side = field.startsWith('first-') ? first : field.startsWith('second-') ? second : null;
  switch (rule) {
    case 'missing': return `${side} has no lineup.`;
    case 'count': return side ? `${possessive(side)} lineup needs exactly ${required} players.` : `Choose exactly ${required} players.`;
    case 'duplicate': return 'A player is chosen twice.';
    case 'not-on-roster': return side ? `${possessive(side)} lineup has a player who is not on its frozen roster.` : 'A player is not on the team’s frozen roster.';
    case 'both-sides': return 'A player is in both lineups.';
    case 'unavailable': return unavailable.length
      ? `${possessive(side ?? 'The')} lineup includes ${unavailable.join(', ')}, ${unavailable.length === 1 ? 'who is' : 'who are'} unavailable. Revise the lineup from the other eligible players.`
      : 'A chosen player is withdrawn or sanctioned.';
    case 'too-few-eligible': return `${side} has fewer than ${required} eligible players. Record an outcome when you decide; the team is not withdrawn automatically.`;
    case 'unknown': return 'The frozen rosters have not arrived yet. Try again in a moment.';
    case 'started': return 'The match has started; its lineups are locked.';
    case 'individual': return 'An individual match has no lineup.';
    case 'resolved': return 'This match already has a result. Use “Correct result” to change it.';
    case 'not-resolved': return 'This match has no result yet: record one instead.';
    case 'not-started': return 'Start the match first: its lineups lock at start.';
    default: return 'Check the request and try again.';
  }
};
