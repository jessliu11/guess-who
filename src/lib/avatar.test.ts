import { getInitials, getColorForName } from './avatar';

describe('getInitials', () => {
  it('returns the first two letters of a single-word name', () => {
    expect(getInitials('Jessica')).toBe('JE');
  });

  it('returns the first letter of the first and last word for multi-word names', () => {
    expect(getInitials('Jessica Liu')).toBe('JL');
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('uppercases lowercase input', () => {
    expect(getInitials('bob')).toBe('BO');
  });

  it('returns "?" for empty or whitespace-only names', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('handles extra whitespace between words', () => {
    expect(getInitials('Jessica   Liu')).toBe('JL');
  });
});

describe('getColorForName', () => {
  it('returns the same color for the same input (deterministic)', () => {
    expect(getColorForName('Bob')).toBe(getColorForName('Bob'));
  });

  it('returns a hex color from the palette', () => {
    expect(getColorForName('Bob')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('returns a fallback color for empty input', () => {
    expect(getColorForName('')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('returns different colors for at least some different inputs', () => {
    const colors = new Set(
      ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'].map(getColorForName),
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});
