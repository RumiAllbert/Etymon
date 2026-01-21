import { morphemeSchema, type Morpheme } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { getMemoryCache, setMemoryCache } from "@/lib/server-cache";
import { getDbCache, setDbCache } from "@/lib/db-cache";

export const maxDuration = 30;

const systemPrompt = `You are an expert morphologist and etymologist specializing in word formation.

Given a prefix, suffix, or root, provide comprehensive information about this morpheme.

Guidelines:
1. Identify whether it's a prefix, suffix, or root
2. Provide the meaning and language of origin
3. Include the original form if from Greek/Latin
4. Provide 5-10 example words using this morpheme
5. Include related morphemes with similar meanings or functions
6. Be accurate about the morpheme's function and meaning

Common prefixes: un-, re-, pre-, dis-, mis-, anti-, over-, under-, sub-, super-, inter-, trans-
Common suffixes: -tion, -ness, -ment, -ful, -less, -able, -ible, -ous, -ive, -ly
Common roots: graph, port, dict, spec, ject, duct, struct, scribe/script

Example for "bio-":
- Type: prefix
- Meaning: life, living
- Origin: Greek βίος (bios)
- Examples: biology, biography, biodiversity, biosphere, biopsy, biotic
- Related: vit- (Latin, life), zoo- (Greek, animal)`;

export async function POST(req: Request) {
  try {
    const { morpheme } = await req.json();

    if (!morpheme) {
      return Response.json({ error: "Morpheme is required" }, { status: 400 });
    }

    const cacheParams = { morpheme: morpheme.toLowerCase() };

    // 1. Check server memory cache
    const memoryCached = getMemoryCache<Morpheme>("morpheme", cacheParams);
    if (memoryCached) {
      return Response.json(memoryCached);
    }

    // 2. Check database cache
    const dbCached = await getDbCache<Morpheme>("morpheme", cacheParams);
    if (dbCached) {
      // Memory cache was already populated by getDbCache
      return Response.json(dbCached);
    }

    // 3. Cache miss - call Gemini API
    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: morphemeSchema,
      system: systemPrompt,
      prompt: `Analyze the morpheme "${morpheme}" comprehensively.

Provide:
1. Whether it's a prefix, suffix, or root
2. Its meaning and language of origin
3. The original form if from Greek/Latin
4. 5-10 common English words that use this morpheme
5. Related morphemes with similar meanings or functions

Be thorough and accurate. Focus on how this morpheme is used in modern English.`,
    });

    // 4. Store in memory cache
    setMemoryCache("morpheme", cacheParams, object);

    // 5. Store in database cache (async, don't await)
    setDbCache("morpheme", cacheParams, object).catch((err) => {
      console.error("[Cache] Failed to store morpheme in DB:", err);
    });

    return Response.json(object);
  } catch (error) {
    console.error("Morpheme error:", error);
    return Response.json(
      { error: "Failed to analyze morpheme" },
      { status: 500 }
    );
  }
}
