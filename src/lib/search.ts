/**
 * Fuzzy search utility using Levenshtein distance.
 * Uses iterative dynamic programming for optimal performance.
 */

/**
 * Calculate Levenshtein distance between two strings using iterative DP.
 * This is a classic dynamic programming problem solved with bottom-up approach.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Handle base cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Create a 2D array for memoization
  // dp[i][j] = edit distance between a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        // Characters match, no operation needed
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Take minimum of insert, delete, or substitute
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // deletion
            dp[i][j - 1], // insertion
            dp[i - 1][j - 1] // substitution
          );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between query and text.
 * Returns a score where lower is better (0 = exact match).
 */
function calculateSimilarity(query: string, text: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  // Direct inclusion is best match
  if (lowerText.includes(lowerQuery)) {
    return 0;
  }

  // Check word-by-word matching
  const words = lowerText.split(/\s+/);
  const queryWords = lowerQuery.split(/\s+/);

  let minDistance = Infinity;

  for (const queryWord of queryWords) {
    for (const word of words) {
      // Skip very short words for efficiency
      if (word.length < 2) continue;

      const dist = levenshteinDistance(queryWord, word);
      // Normalize by word length for fair comparison
      const normalized = dist / Math.max(queryWord.length, word.length);
      if (normalized < minDistance) {
        minDistance = normalized;
      }
    }
  }

  return minDistance;
}

export interface SearchResult<T> {
  item: T;
  score: number;
}

/**
 * Perform fuzzy search on a list of items.
 *
 * @param query - The search query string
 * @param items - Array of items to search
 * @param getSearchableText - Function to extract searchable text fields from an item
 * @param threshold - Maximum normalized distance to include in results (0-1, default 0.5)
 * @returns Sorted array of matching items (best matches first)
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  getSearchableText: (item: T) => string[],
  threshold = 0.5
): T[] {
  if (!query.trim()) return items;

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const texts = getSearchableText(item);
    let bestScore = Infinity;

    for (const text of texts) {
      const score = calculateSimilarity(query, text);
      if (score < bestScore) {
        bestScore = score;
      }
    }

    if (bestScore <= threshold) {
      results.push({ item, score: bestScore });
    }
  }

  // Sort by score (lower is better)
  results.sort((a, b) => a.score - b.score);

  return results.map((r) => r.item);
}
