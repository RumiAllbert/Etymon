/**
 * Cache utilities for normalized key generation and TTL configuration
 */

export type CacheType =
  | "word_of_the_day"
  | "word_family"
  | "morpheme"
  | "cognates"
  | "timeline"
  | "etymology";

export interface CacheParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * TTL configuration in milliseconds
 */
export const CACHE_TTL = {
  // Server memory cache TTLs
  memory: {
    word_of_the_day: 24 * 60 * 60 * 1000, // 24 hours
    word_family: 24 * 60 * 60 * 1000, // 24 hours
    morpheme: 24 * 60 * 60 * 1000, // 24 hours
    cognates: 12 * 60 * 60 * 1000, // 12 hours
    timeline: 12 * 60 * 60 * 1000, // 12 hours
    etymology: 6 * 60 * 60 * 1000, // 6 hours
  },
  // Database cache TTLs
  database: {
    word_of_the_day: 30 * 24 * 60 * 60 * 1000, // 30 days
    word_family: 7 * 24 * 60 * 60 * 1000, // 7 days
    morpheme: 7 * 24 * 60 * 60 * 1000, // 7 days
    cognates: 7 * 24 * 60 * 60 * 1000, // 7 days
    timeline: 7 * 24 * 60 * 60 * 1000, // 7 days
    etymology: 3 * 24 * 60 * 60 * 1000, // 3 days
  },
  // Client-side TanStack Query staleTime
  client: {
    word_of_the_day: 24 * 60 * 60 * 1000, // 24 hours
    word_family: 30 * 60 * 1000, // 30 minutes
    morpheme: 30 * 60 * 1000, // 30 minutes
    cognates: 15 * 60 * 1000, // 15 minutes
    timeline: 15 * 60 * 1000, // 15 minutes
    etymology: 60 * 60 * 1000, // 60 minutes
  },
} as const;

/**
 * LRU cache size limits per cache type
 */
export const CACHE_MAX_SIZE = {
  word_of_the_day: 10, // Only need to store a few days
  word_family: 200, // Common roots
  morpheme: 200, // Common morphemes
  cognates: 500, // Word-based
  timeline: 500, // Word-based
  etymology: 1000, // Main etymology cache
} as const;

/**
 * Generate a normalized cache key from type and parameters
 * Format: {param1}:{value1}|{param2}:{value2}
 *
 * @param type - The cache type
 * @param params - The parameters to include in the key
 * @returns A normalized cache key string
 */
export function generateCacheKey(type: CacheType, params: CacheParams): string {
  // Sort parameters for consistent key generation
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${normalizeValue(value)}`)
    .join("|");

  return sortedParams || type;
}

/**
 * Normalize a value for cache key inclusion
 */
function normalizeValue(value: string | number | boolean | undefined): string {
  if (value === undefined) return "";
  if (typeof value === "string") {
    // Normalize string: lowercase, trim, remove extra whitespace
    return value.toLowerCase().trim().replace(/\s+/g, "_");
  }
  return String(value);
}

/**
 * Get the expiration date for a cache type
 */
export function getDbExpiresAt(type: CacheType): Date {
  const ttl = CACHE_TTL.database[type];
  return new Date(Date.now() + ttl);
}

/**
 * Check if a cache entry is expired
 */
export function isCacheExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiry.getTime() < Date.now();
}
