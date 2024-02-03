export const levenshteinDistance = (a: string, b: string) => {
  const matrix = [];

  // Create the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Calculate the distance
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

export const isSimilar = (a: string, b: string, threshold: number) => {
  // Handling case where both strings are empty
  if (a.length === 0 && b.length === 0) return true;
  // If one string is empty and the other is not, and the threshold is 0,
  // return false to indicate no similarity.
  if ((a.length === 0 || b.length === 0) && threshold === 0) return false;
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  // If max length is 0 (which should be covered by earlier checks), avoid division by zero
  if (maxLen === 0) return false;
  const similarity = (1 - distance / maxLen) * 100;
  return similarity >= threshold;
};

export const getSimilarity = (a: string, b: string) => {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = (1 - distance / maxLen) * 100;
  return similarity;
};