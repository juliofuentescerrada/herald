import { organisationKey } from '../../platform';

/** Shared with the schedule feature, so starting a match refreshes the schedule's states. */
export { scheduleKey, tournamentKey } from '../../platform';

export const matchKey = (organisation: string, tournamentId: string, matchId: string) => organisationKey(organisation, 'match', tournamentId, matchId);

/** A blocker code from the API ("second-lineup-missing") as its field and rule. */
export const splitBlocker = (code: string): [string, string] => {
  const field = ['first-lineup', 'second-lineup', 'players', 'roster'].find((name) => code.startsWith(`${name}-`)) ?? '';
  return [field, code.slice(field.length + 1)];
};

/** The API's rule codes in words, naming the side's team; the API applies the rules, the page only reports them. */
export const ruleText = (field: string, rule: string, required: number | null, first: string, second: string): string => {
  const side = field === 'first-lineup' ? first : field === 'second-lineup' ? second : null;
  switch (rule) {
    case 'missing': return `${side} has no lineup.`;
    case 'count': return side ? `${side}’s lineup needs exactly ${required} players.` : `Choose exactly ${required} players.`;
    case 'duplicate': return 'A player is chosen twice.';
    case 'not-on-roster': return side ? `${side}’s lineup has a player who is not on its frozen roster.` : 'A player is not on the team’s frozen roster.';
    case 'both-sides': return 'A player is in both lineups.';
    case 'unknown': return 'The frozen rosters have not arrived yet. Try again in a moment.';
    case 'started': return 'The match has started; its lineups are locked.';
    case 'individual': return 'An individual match has no lineup.';
    default: return 'Check the request and try again.';
  }
};
