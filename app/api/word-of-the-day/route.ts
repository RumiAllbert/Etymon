import { wordSchema } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const wordOfTheDayResponseSchema = z.object({
  word: z.string(),
  definition: wordSchema,
  funFact: z.string(),
  usageExample: z.string(),
});

const systemPrompt = `You are an expert etymologist curating fascinating words for Word of the Day.

Select words that are:
1. Interesting etymologically - they have a surprising or illuminating origin
2. Useful - words that educated speakers might actually use
3. Not too obscure - avoid extremely rare or archaic words
4. Rich in history - words with a journey through multiple languages/cultures

For each word, provide:
1. A complete etymology breakdown (following the standard format)
2. A fun fact about the word's history or usage
3. An example sentence showing proper usage

Example words with great etymologies:
- serendipity (from a Persian fairy tale)
- muscle (from Latin for "little mouse")
- salary (from Latin for "salt money")
- candidate (from Latin for "white-robed")
- sinister (from Latin for "left-handed")`;

export async function GET() {
  try {
    // Use the current date as a seed for consistent daily word
    const today = new Date().toISOString().split("T")[0];

    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: wordOfTheDayResponseSchema,
      system: systemPrompt,
      prompt: `Generate a Word of the Day for ${today}.

Choose an interesting English word with a fascinating etymology. Provide:
1. The word
2. Complete etymology breakdown including:
   - A "thought" explaining the word's origin
   - Word parts with their origins and meanings
   - How the parts combine
   - Similar words with shared origins (1-3 words)
3. A fun fact about the word
4. An example sentence

Make sure the word has a genuinely interesting history that will educate and delight readers.`,
    });

    return Response.json({
      ...object,
      featuredDate: today,
    });
  } catch (error) {
    console.error("Word of the day error:", error);
    return Response.json(
      { error: "Failed to generate word of the day" },
      { status: 500 }
    );
  }
}
