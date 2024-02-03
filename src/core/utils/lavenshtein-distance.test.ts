import { levenshteinDistance, isSimilar } from './lavenshtein-distance.js'; // Adjust the import path as necessary

describe('levenshteinDistance', () => {
  test('calculates correct distance between two strings', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('flaw', 'lawn')).toBe(2);
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  test('is case sensitive', () => {
    expect(levenshteinDistance('abc', 'ABC')).toBe(3);
  });
});

describe('isSimilar', () => {
  test('returns true if similarity is above or equal to the threshold', () => {
    expect(isSimilar('abc', 'abc', 100)).toBe(true);
    expect(isSimilar('abba', 'abbd', 50)).toBe(true); 
    expect(isSimilar('abc', 'axc', 66)).toBe(true);
  });

  test('returns false if similarity is below the threshold', () => {
    expect(isSimilar('abc', 'abd', 100)).toBe(false);
    expect(isSimilar('kitten', 'sitting', 60)).toBe(false); // ~57% similarity, but threshold is higher
  });

  test('handles empty strings correctly', () => {
    expect(isSimilar('', '', 100)).toBe(true);
    expect(isSimilar('abc', '', 0)).toBe(false); // Even 0% threshold should not consider these similar
    expect(isSimilar('', 'abc', 0)).toBe(false);
  });
});
