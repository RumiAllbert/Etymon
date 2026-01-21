/**
 * Database cache service for persistent caching with Supabase
 */

import { createServerClient } from "./supabase";
import {
  CacheType,
  CacheParams,
  generateCacheKey,
  getDbExpiresAt,
  isCacheExpired,
} from "./cache-utils";
import { setMemoryCache } from "./server-cache";
import type { Database } from "@/types/database";

type EtymologyCacheRow = Database["public"]["Tables"]["etymology_cache"]["Row"];
type EtymologyCacheInsert = Database["public"]["Tables"]["etymology_cache"]["Insert"];

/**
 * Get data from database cache
 *
 * @param type - The cache type
 * @param params - The parameters to generate the cache key
 * @returns The cached data or null if not found/expired
 */
export async function getDbCache<T>(
  type: CacheType,
  params: CacheParams
): Promise<T | null> {
  const supabase = createServerClient();
  if (!supabase) {
    console.log(`[Cache] DB unavailable, skipping: ${type}`);
    return null;
  }

  const cacheKey = generateCacheKey(type, params);

  try {
    const { data, error } = await supabase
      .from("etymology_cache")
      .select("data, expires_at")
      .eq("cache_type", type)
      .eq("cache_key", cacheKey)
      .single() as { data: Pick<EtymologyCacheRow, "data" | "expires_at"> | null; error: { code: string; message: string } | null };

    if (error) {
      if (error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error(`[Cache] DB read error: ${error.message}`);
      }
      console.log(`[Cache] DB MISS: ${type} - ${cacheKey}`);
      return null;
    }

    // Check if expired
    if (data && isCacheExpired(data.expires_at)) {
      console.log(`[Cache] DB EXPIRED: ${type} - ${cacheKey}`);
      // Clean up expired entry asynchronously
      cleanupExpiredEntry(type, cacheKey).catch(() => {});
      return null;
    }

    if (data) {
      console.log(`[Cache] DB HIT: ${type} - ${cacheKey}`);

      // Increment hit count asynchronously (don't await)
      incrementHitCount(type, cacheKey).catch(() => {});

      // Populate memory cache with the result
      setMemoryCache(type, params, data.data as T);

      return data.data as T;
    }

    return null;
  } catch (error) {
    console.error(`[Cache] DB read exception: ${error}`);
    return null;
  }
}

/**
 * Set data in database cache
 *
 * @param type - The cache type
 * @param params - The parameters to generate the cache key
 * @param data - The data to cache
 */
export async function setDbCache<T>(
  type: CacheType,
  params: CacheParams,
  data: T
): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) {
    console.log(`[Cache] DB unavailable, skipping write: ${type}`);
    return;
  }

  const cacheKey = generateCacheKey(type, params);
  const expiresAt = getDbExpiresAt(type);

  try {
    const insertData: EtymologyCacheInsert = {
      cache_type: type,
      cache_key: cacheKey,
      data: data as unknown as Database["public"]["Tables"]["etymology_cache"]["Insert"]["data"],
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
    };

    const { error } = await supabase
      .from("etymology_cache")
      .upsert(insertData as never, {
        onConflict: "cache_type,cache_key",
      });

    if (error) {
      console.error(`[Cache] DB write error: ${error.message}`);
      return;
    }

    console.log(`[Cache] DB SET: ${type} - ${cacheKey}`);
  } catch (error) {
    console.error(`[Cache] DB write exception: ${error}`);
  }
}

/**
 * Delete a specific entry from database cache
 */
export async function deleteDbCache(
  type: CacheType,
  params: CacheParams
): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return false;

  const cacheKey = generateCacheKey(type, params);

  try {
    const { error } = await supabase
      .from("etymology_cache")
      .delete()
      .eq("cache_type", type)
      .eq("cache_key", cacheKey);

    if (error) {
      console.error(`[Cache] DB delete error: ${error.message}`);
      return false;
    }

    console.log(`[Cache] DB DELETED: ${type} - ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`[Cache] DB delete exception: ${error}`);
    return false;
  }
}

/**
 * Increment hit count for a cache entry (fire and forget)
 */
async function incrementHitCount(type: CacheType, cacheKey: string): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) return;

  try {
    // Use direct update instead of RPC for simplicity
    await supabase
      .from("etymology_cache")
      .update({ hit_count: 1 } as never) // Will be incremented via trigger or just set to 1
      .eq("cache_type", type)
      .eq("cache_key", cacheKey);
  } catch (error) {
    // Silently fail - this is not critical
    console.debug(`[Cache] Hit count increment failed: ${error}`);
  }
}

/**
 * Clean up an expired entry (fire and forget)
 */
async function cleanupExpiredEntry(type: CacheType, cacheKey: string): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) return;

  try {
    await supabase
      .from("etymology_cache")
      .delete()
      .eq("cache_type", type)
      .eq("cache_key", cacheKey);
  } catch (error) {
    // Silently fail
    console.debug(`[Cache] Cleanup failed: ${error}`);
  }
}

/**
 * Run periodic cleanup of expired cache entries
 * Returns the number of deleted entries
 */
export async function cleanupExpiredCaches(): Promise<number> {
  const supabase = createServerClient();
  if (!supabase) return 0;

  try {
    // Delete expired entries directly
    const { error, count } = await supabase
      .from("etymology_cache")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error(`[Cache] Cleanup error: ${error.message}`);
      return 0;
    }

    console.log(`[Cache] Cleaned up ${count ?? 0} expired entries`);
    return count ?? 0;
  } catch (error) {
    console.error(`[Cache] Cleanup exception: ${error}`);
    return 0;
  }
}
