import { LineResult, StandingsLine } from '@herald/api-client/admin';

/** Shared with the matches feature, so recording a result refreshes the standings. */
export { scheduleKey, standingsKey, tournamentKey } from '../../platform';

const resultWords: Record<NonNullable<LineResult>, string> = { won: 'won', drawn: 'draw', lost: 'lost', noWinner: 'no winner' };

/** A cause code in words: "played", "doubleAbsence" → "double absence". */
export const causeText = (cause: string): string => cause.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);

export const pointsText = (points: number): string => `${points} ${points === 1 ? 'point' : 'points'}`;

/** "Round 1 · vs Jamie Brook · draw · played · 1 point", or "Round 2 · Rest · no points". */
export const lineText = (line: StandingsLine): string =>
  line.opponent
    ? `Round ${line.round} · vs ${line.opponent.name} · ${resultWords[line.result!]} · ${causeText(line.cause ?? '')} · ${pointsText(line.points)}`
    : `Round ${line.round} · Rest · no points`;
