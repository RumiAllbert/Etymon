import { wordSchema, type Definition } from "@/utils/schema";
import { CACHE_PREFIX, CACHE_EXPIRY } from "./constants";
import {
  normalizeWord,
  isWordMismatch,
  hasNonLatinChars,
  levenshteinDistance,
} from "./helpers";
import { toast } from "sonner";

interface CachedWord {
  data: Definition;
  timestamp: number;
  originalWord: string;
}

/**
 * Get a cached word definition
 */
export function getCachedWord(word: string): Definition | null {
  if (typeof window === "undefined") return null;

  try {
    const normalizedSearchWord = normalizeWord(word);
    const cacheKey = CACHE_PREFIX + normalizedSearchWord;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    let parsedCache: CachedWord;
    try {
      parsedCache = JSON.parse(cached);
    } catch {
      localStorage.removeItem(cacheKey);
      return null;
    }

    const { data, timestamp, originalWord } = parsedCache;

    // Check expiry
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Validate word match
    const normalizedOriginal = normalizeWord(originalWord);
    if (normalizedOriginal !== normalizedSearchWord) {
      if (
        hasNonLatinChars(originalWord) ||
        hasNonLatinChars(word)
      ) {
        const normalizedOriginalNFD = normalizedOriginal.normalize("NFD");
        const normalizedSearchNFD = normalizedSearchWord.normalize("NFD");

        if (normalizedOriginalNFD !== normalizedSearchNFD) {
          const distance = levenshteinDistance(
            normalizedOriginal,
            normalizedSearchWord
          );
          const maxLength = Math.max(
            normalizedOriginal.length,
            normalizedSearchWord.length
          );
          const threshold = Math.max(1, Math.floor(maxLength * 0.2));

          if (distance > threshold) {
            localStorage.removeItem(cacheKey);
            return null;
          }
        }
      } else {
        localStorage.removeItem(cacheKey);
        return null;
      }
    }

    // Validate schema
    try {
      const validatedData = wordSchema.parse(data);

      if (
        !validatedData.parts?.length ||
        !validatedData.combinations?.length ||
        !validatedData.similarWords?.length ||
        !validatedData.thought
      ) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Validate parts
      const validParts = validatedData.parts.every(
        (part) =>
          part.id &&
          part.text &&
          part.originalWord &&
          part.origin &&
          part.meaning
      );

      // Validate combinations
      const validCombinations = validatedData.combinations.every(
        (layer) =>
          layer.length > 0 &&
          layer.every(
            (combo) =>
              combo.id &&
              combo.text &&
              combo.definition &&
              Array.isArray(combo.sourceIds) &&
              combo.sourceIds.length > 0
          )
      );

      // Validate similar words
      const validSimilarWords = validatedData.similarWords.every(
        (w) => w.word && w.explanation && w.sharedOrigin
      );

      if (!validParts || !validCombinations || !validSimilarWords) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check final word match
      const lastLayer =
        validatedData.combinations[validatedData.combinations.length - 1];
      if (lastLayer && lastLayer.length > 0) {
        const finalWord = lastLayer[0].text;

        if (!hasNonLatinChars(word) && !hasNonLatinChars(finalWord)) {
          if (isWordMismatch(word, finalWord, validatedData.thought)) {
            localStorage.removeItem(cacheKey);
            return null;
          }
        }
      }

      return validatedData;
    } catch {
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch {
    clearCorruptedCache();
    return null;
  }
}

/**
 * Cache a word definition
 */
export function cacheWord(word: string, data: Definition): void {
  if (typeof window === "undefined") return;

  try {
    const normalizedWord = normalizeWord(word);
    const cacheKey = CACHE_PREFIX + normalizedWord;

    localStorage.removeItem(cacheKey);

    try {
      const validatedData = wordSchema.parse(data);

      if (
        !validatedData.parts ||
        !validatedData.combinations ||
        !validatedData.similarWords
      ) {
        throw new Error("Missing required fields");
      }

      const lastLayer =
        validatedData.combinations[validatedData.combinations.length - 1];
      if (lastLayer && lastLayer.length > 0) {
        const finalWord = lastLayer[0].text;

        if (!hasNonLatinChars(word) && !hasNonLatinChars(finalWord)) {
          if (isWordMismatch(word, finalWord, validatedData.thought)) {
            throw new Error("Word mismatch");
          }
        }
      }

      const cacheData: CachedWord = {
        data: validatedData,
        timestamp: Date.now(),
        originalWord: word,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch {
      return;
    }
  } catch {
    try {
      clearOldCache();
    } catch {
      // Ignore
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    });

    if (keysToRemove.length > 0) {
      toast.success(`Cleared ${keysToRemove.length} cached words`);
    } else {
      toast.info("No cached words to clear");
    }
  } catch {
    toast.error("Failed to clear cache");
  }
}

/**
 * Clear corrupted cache entries
 */
export function clearCorruptedCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { data } = JSON.parse(cached);
            wordSchema.parse(data);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    });
  } catch {
    // Ignore
  }
}

/**
 * Clear expired cache entries
 */
export function clearOldCache(): void {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > CACHE_EXPIRY) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    });
  } catch {
    // Ignore
  }
}
