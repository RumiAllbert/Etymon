import { wordFamilySchema } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export const maxDuration = 30;

const systemPrompt = `You are an expert etymologist specializing in word families and morphological analysis.

Given a root, prefix, or suffix, provide a comprehensive list of words that share this element.

Guidelines:
1. Include 5-15 words that clearly derive from or contain the given morpheme
2. Prioritize common, recognizable words
3. Include a mix of simple and complex derivatives
4. Provide accurate part of speech labels
5. Explain the relationship of each word to the root
6. Include related roots when applicable
7. For Greek/Latin roots, include the original script if applicable

Example for root "graph" (Greek γράφειν - to write):
- graphic (adjective): relating to writing or drawing
- biography (noun): written account of someone's life
- photograph (noun): image captured by writing with light
- telegraph (noun): device for writing at a distance
- autograph (noun): one's own writing/signature
- calligraphy (noun): beautiful writing
- graphite (noun): material that writes/marks`;

export async function POST(req: Request) {
  try {
    const { root, type = "root" } = await req.json();

    if (!root) {
      return Response.json({ error: "Root/morpheme is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: wordFamilySchema,
      system: systemPrompt,
      prompt: `Analyze the ${type} "${root}" and provide a comprehensive word family.

Include:
1. The meaning and origin of the root
2. 5-15 English words that derive from or contain this root
3. For each word: part of speech, meaning, and how it relates to the root
4. Any related roots that have similar meanings

Be thorough and accurate. Focus on common English words that most educated speakers would recognize.`,
    });

    return Response.json(object);
  } catch (error) {
    console.error("Word family error:", error);
    return Response.json(
      { error: "Failed to generate word family" },
      { status: 500 }
    );
  }
}
