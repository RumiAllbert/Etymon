/**
 * Server-side LRU memory cache for fast in-memory caching
 */

import { LRUCache } from "lru-cache";
import {
  CacheType,
  CacheParams,
  generateCacheKey,
  CACHE_TTL,
  CACHE_MAX_SIZE,
} from "./cache-utils";

// Type-safe cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Individual LRU caches per type for better memory management
const caches = new Map<CacheType, LRUCache<string, CacheEntry<unknown>>>();

/**
 * Get or create an LRU cache for a specific cache type
 */
function getCache(type: CacheType): LRUCache<string, CacheEntry<unknown>> {
  let cache = caches.get(type);
  if (!cache) {
    cache = new LRUCache<string, CacheEntry<unknown>>({
      max: CACHE_MAX_SIZE[type],
      ttl: CACHE_TTL.memory[type],
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
    caches.set(type, cache);
  }
  return cache;
}

/**
 * Get data from server memory cache
 *
 * @param type - The cache type
 * @param params - The parameters to generate the cache key
 * @returns The cached data or null if not found/expired
 */
export function getMemoryCache<T>(type: CacheType, params: CacheParams): T | null {
  const cache = getCache(type);
  const key = generateCacheKey(type, params);
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (entry) {
    console.log(`[Cache] Memory HIT: ${type} - ${key}`);
    return entry.data;
  }

  console.log(`[Cache] Memory MISS: ${type} - ${key}`);
  return null;
}

/**
 * Set data in server memory cache
 *
 * @param type - The cache type
 * @param params - The parameters to generate the cache key
 * @param data - The data to cache
 */
export function setMemoryCache<T>(
  type: CacheType,
  params: CacheParams,
  data: T
): void {
  const cache = getCache(type);
  const key = generateCacheKey(type, params);

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  cache.set(key, entry);
  console.log(`[Cache] Memory SET: ${type} - ${key}`);
}

/**
 * Delete a specific entry from memory cache
 */
export function deleteMemoryCache(type: CacheType, params: CacheParams): boolean {
  const cache = getCache(type);
  const key = generateCacheKey(type, params);
  return cache.delete(key);
}

/**
 * Clear all entries for a specific cache type
 */
export function clearMemoryCache(type: CacheType): void {
  const cache = caches.get(type);
  if (cache) {
    cache.clear();
    console.log(`[Cache] Memory CLEARED: ${type}`);
  }
}

/**
 * Clear all caches
 */
export function clearAllMemoryCaches(): void {
  for (const [type, cache] of caches) {
    cache.clear();
    console.log(`[Cache] Memory CLEARED: ${type}`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Record<CacheType, { size: number; maxSize: number }> {
  const stats: Partial<Record<CacheType, { size: number; maxSize: number }>> = {};

  for (const [type, cache] of caches) {
    stats[type] = {
      size: cache.size,
      maxSize: CACHE_MAX_SIZE[type],
    };
  }

  return stats as Record<CacheType, { size: number; maxSize: number }>;
}
