/** A match's effective result in words, never as a score: "Robin Vale won", "Draw" (h1-operator-results D-3). */
export const resultText = (result: { readonly outcome: 'first' | 'second' | 'draw' }, first: string, second: string): string => {
  if (result.outcome === 'draw') return 'Draw';
  return `${result.outcome === 'first' ? first : second} won`;
};
