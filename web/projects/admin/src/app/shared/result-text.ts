/** The fields of a match result the words need; shared code takes no API client types (boundaries). */
interface Result {
  readonly outcome: 'first' | 'second' | 'draw' | 'none';
  readonly cause: 'played' | 'concession' | 'singleAbsence' | 'doubleAbsence' | 'noContest' | 'voidedCancelled';
  readonly played: boolean;
  readonly reason?: string | null;
}

/**
 * A match's effective result in words, never as a score (h1-operator-results D-3, h1-exceptional-outcomes D-3):
 * "Robin Vale won", "Draw", "Sam Reed conceded before play · Robin Vale wins · no play recorded".
 */
export const resultText = (result: Result, first: string, second: string): string => {
  const winner = result.outcome === 'first' ? first : second;
  const loser = result.outcome === 'first' ? second : first;
  const play = result.played ? 'play recorded' : 'no play recorded';
  switch (result.cause) {
    case 'concession':
      return result.played ? `${loser} conceded after play · ${winner} wins` : `${loser} conceded before play · ${winner} wins · ${play}`;
    case 'singleAbsence': return `${loser} was absent · ${winner} wins · ${play}`;
    case 'doubleAbsence': return `Both were absent · 0 each · ${play}`;
    case 'noContest': return `No contest: ${result.reason ?? ''} · 0 each · ${play}`;
    case 'voidedCancelled': return 'Voided: tournament cancelled · no points';
    default: return result.outcome === 'draw' ? 'Draw' : `${winner} won`;
  }
};

/** "River Falcons’ lineup", "North Stars’ lineup", "Robin’s lineup": the British possessive. */
export const possessive = (name: string) => (name.endsWith('s') ? `${name}’` : `${name}’s`);
