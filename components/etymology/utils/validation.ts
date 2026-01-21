import { wordSchema } from "@/utils/schema";
import { isWordMismatch, hasNonLatinChars, normalizeWord } from "./helpers";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate API response data
 */
export function validateApiResponse(
  data: unknown,
  searchWord: string
): ValidationResult {
  try {
    const validatedData = wordSchema.parse(data);

    // Check required fields
    if (
      !validatedData.parts?.length ||
      !validatedData.combinations?.length ||
      !validatedData.similarWords?.length ||
      !validatedData.thought
    ) {
      return {
        valid: false,
        error: "Missing required fields or empty arrays in API response",
      };
    }

    // Validate parts structure
    const validParts = validatedData.parts.every(
      (part) =>
        part.id && part.text && part.originalWord && part.origin && part.meaning
    );

    if (!validParts) {
      return {
        valid: false,
        error: "Invalid structure in parts field of API response",
      };
    }

    // Validate combinations structure
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

    if (!validCombinations) {
      return {
        valid: false,
        error: "Invalid structure in combinations field of API response",
      };
    }

    // Validate similar words structure
    const validSimilarWords = validatedData.similarWords.every(
      (word) => word.word && word.explanation && word.sharedOrigin
    );

    if (!validSimilarWords) {
      return {
        valid: false,
        error: "Invalid structure in similarWords field of API response",
      };
    }

    // Check final word match
    const lastLayer =
      validatedData.combinations[validatedData.combinations.length - 1];
    if (lastLayer && lastLayer.length > 0) {
      const finalWord = lastLayer[0].text;

      const hasNonLatin =
        hasNonLatinChars(searchWord) || hasNonLatinChars(finalWord);

      if (!hasNonLatin) {
        if (isWordMismatch(searchWord, finalWord, validatedData.thought)) {
          return {
            valid: false,
            error: `API returned data for a different word: "${finalWord}" instead of "${searchWord}"`,
          };
        }
      }
    }

    // Check thought field (warning only)
    const normalizedSearchWord = normalizeWord(searchWord);
    if (
      !validatedData.thought.toLowerCase().includes(normalizedSearchWord) &&
      !validatedData.thought
        .toLowerCase()
        .normalize("NFD")
        .includes(normalizedSearchWord.normalize("NFD"))
    ) {
      console.warn(
        `Warning: Thought field doesn't explicitly mention search word "${searchWord}"`
      );
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Fetch with retry and validation
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number,
  word: string
): Promise<{ response: Response; data: unknown }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok && response.status !== 203) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      const validation = validateApiResponse(data, word);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid API response");
      }

      return { response, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry for certain errors
      if (
        lastError.message.includes("timeout") ||
        lastError.message.includes("credits") ||
        lastError.message.includes("API returned data for a different word")
      ) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Unknown error occurred during API call");
}
