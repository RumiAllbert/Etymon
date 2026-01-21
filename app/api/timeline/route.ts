import { timelineSchema, type Timeline } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { getMemoryCache, setMemoryCache } from "@/lib/server-cache";
import { getDbCache, setDbCache } from "@/lib/db-cache";

export const maxDuration = 30;

const systemPrompt = `You are an expert historical linguist specializing in the diachronic evolution of words.

Given a word, trace its evolution through history, showing how it changed through different time periods and languages.

Guidelines:
1. Start from the oldest known ancestor (often Proto-Indo-European or a classical language)
2. Show the progression through intermediate languages
3. Include approximate dates or centuries
4. Show phonological and semantic changes
5. Include the word form in each period/language
6. Provide pronunciation (IPA) when helpful
7. Note any significant meaning shifts

Common evolutionary paths:
- PIE → Proto-Germanic → Old English → Middle English → Modern English
- PIE → Latin → Old French → Middle English → Modern English
- Ancient Greek → Latin → Old French → Middle English → Modern English
- PIE → Sanskrit → Hindi (for Indo-Aryan loans)

Example for "father":
1. PIE *ph₂tḗr (800 BCE) - "father, protector"
2. Proto-Germanic *fadēr (500 BCE) - "father"
3. Old English fæder (600 CE) - "father, supreme being"
4. Middle English fader (1200 CE) - "male parent"
5. Modern English father (1500 CE) - "male parent"`;

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    const cacheParams = { word: word.toLowerCase() };

    // 1. Check server memory cache
    const memoryCached = getMemoryCache<Timeline>("timeline", cacheParams);
    if (memoryCached) {
      return Response.json(memoryCached);
    }

    // 2. Check database cache
    const dbCached = await getDbCache<Timeline>("timeline", cacheParams);
    if (dbCached) {
      // Memory cache was already populated by getDbCache
      return Response.json(dbCached);
    }

    // 3. Cache miss - call Gemini API
    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: timelineSchema,
      system: systemPrompt,
      prompt: `Trace the historical evolution of the word "${word}" through time.

Provide:
1. A timeline of at least 3-6 stages in the word's evolution
2. For each stage: the time period, language, word form, meaning, and any notes
3. Include approximate dates or centuries
4. Show phonological changes (how the sound changed)
5. Note any semantic shifts (how the meaning changed)
6. A summary of the word's journey through history

Be historically accurate. If the word's history is well-documented, provide that. If parts are speculative, note that.`,
    });

    // 4. Store in memory cache
    setMemoryCache("timeline", cacheParams, object);

    // 5. Store in database cache (async, don't await)
    setDbCache("timeline", cacheParams, object).catch((err) => {
      console.error("[Cache] Failed to store timeline in DB:", err);
    });

    return Response.json(object);
  } catch (error) {
    console.error("Timeline error:", error);
    return Response.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}
