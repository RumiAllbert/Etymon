import { ORIGIN_COLORS } from "./constants";

/**
 * Get the color class for a language origin
 */
export function getOriginColor(origin: string): string {
  const lowerOrigin = origin.toLowerCase();

  for (const [key, value] of Object.entries(ORIGIN_COLORS)) {
    if (key !== "default" && lowerOrigin.includes(key)) {
      return value;
    }
  }

  return ORIGIN_COLORS.default;
}

/**
 * Normalize a word for consistent comparison
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two words are a mismatch considering various factors
 */
export function isWordMismatch(
  searchWord: string,
  responseWord: string,
  thought: string
): boolean {
  const normalizedSearch = normalizeWord(searchWord);
  const normalizedResponse = normalizeWord(responseWord);

  // Direct match
  if (normalizedResponse === normalizedSearch) {
    return false;
  }

  // Check containment
  if (
    normalizedResponse.includes(normalizedSearch) ||
    normalizedSearch.includes(normalizedResponse)
  ) {
    return false;
  }

  // For non-Latin words, check thought
  const hasNonLatinChars = /[^\u0000-\u007F]/.test(responseWord);
  if (hasNonLatinChars && thought.toLowerCase().includes(normalizedSearch)) {
    return false;
  }

  // Check accent differences
  const normalizedSearchNFD = normalizedSearch.normalize("NFD");
  const normalizedResponseNFD = normalizedResponse.normalize("NFD");
  if (normalizedSearchNFD === normalizedResponseNFD) {
    return false;
  }

  // Check Levenshtein distance
  const distance = levenshteinDistance(normalizedSearch, normalizedResponse);
  const maxLength = Math.max(
    normalizedSearch.length,
    normalizedResponse.length
  );
  const threshold = Math.max(1, Math.floor(maxLength * 0.2));

  if (distance <= threshold) {
    return false;
  }

  return true;
}

/**
 * Check if a string contains non-Latin characters
 */
export function hasNonLatinChars(str: string): boolean {
  return /[^\u0000-\u007F]/.test(str);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time until refresh as a string
 */
export function formatTimeUntilRefresh(timestamp: number, interval: number): string {
  const timeLeft = interval - (Date.now() - timestamp);
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  return `~${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`;
}
