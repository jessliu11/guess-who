export function roundFromTurnCount(turnCount: number): number {
  return Math.floor(Math.max(0, turnCount) / 2) + 1;
}
