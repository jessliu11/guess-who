import { roundFromTurnCount } from './round';

describe('roundFromTurnCount', () => {
  it('starts at round 1 before any turns have been taken', () => {
    expect(roundFromTurnCount(0)).toBe(1);
  });

  it('stays in round 1 after the first turn handoff (still mid-cycle)', () => {
    expect(roundFromTurnCount(1)).toBe(1);
  });

  it('advances to round 2 once both players have played', () => {
    expect(roundFromTurnCount(2)).toBe(2);
    expect(roundFromTurnCount(3)).toBe(2);
  });

  it('advances to round 3 after the second full cycle', () => {
    expect(roundFromTurnCount(4)).toBe(3);
    expect(roundFromTurnCount(5)).toBe(3);
  });

  it('clamps negative inputs to round 1', () => {
    expect(roundFromTurnCount(-1)).toBe(1);
  });
});
