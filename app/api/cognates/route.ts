import { cognatesResponseSchema } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export const maxDuration = 30;

const systemPrompt = `You are an expert historical linguist specializing in comparative linguistics and cognate analysis.

Given a word, identify its cognates across multiple languages, especially within the Indo-European language family.

Guidelines:
1. Identify the Proto-Indo-European (PIE) root when applicable
2. Include cognates from at least 5-10 languages
3. Prioritize major language families: Germanic, Romance, Slavic, Indo-Iranian
4. Include the pronunciation (IPA) when possible
5. Note if words are direct cognates, indirect cognates, or false friends
6. Provide the native script for non-Latin alphabet languages

Language codes to use:
- en: English, de: German, nl: Dutch, sv: Swedish, no: Norwegian
- fr: French, es: Spanish, it: Italian, pt: Portuguese, ro: Romanian
- ru: Russian, pl: Polish, cs: Czech, uk: Ukrainian, bg: Bulgarian
- hi: Hindi, sa: Sanskrit, fa: Persian
- el: Greek (modern), grc: Ancient Greek
- la: Latin

Example for "mother":
- Proto-Indo-European: *méh₂tēr (mother)
- English: mother
- German: Mutter
- Dutch: moeder
- French: mère
- Spanish: madre
- Italian: madre
- Russian: мать (mat')
- Sanskrit: मातृ (mātṛ)
- Greek: μητέρα (mitéra)`;

export async function POST(req: Request) {
  try {
    const { word, sourceLanguage = "English" } = await req.json();

    if (!word) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: cognatesResponseSchema,
      system: systemPrompt,
      prompt: `Analyze the ${sourceLanguage} word "${word}" and find its cognates across languages.

Provide:
1. The Proto-Indo-European root (if applicable)
2. Cognates from at least 8-10 different languages
3. For each cognate: the word, language, pronunciation (IPA), meaning, and native script if different
4. Mark whether each is a direct cognate, indirect cognate, or false friend
5. A brief description of the language family tree

Focus on accurate linguistic relationships. Only include true cognates (words descended from a common ancestor), not borrowings.`,
    });

    return Response.json(object);
  } catch (error) {
    console.error("Cognates error:", error);
    return Response.json(
      { error: "Failed to generate cognates" },
      { status: 500 }
    );
  }
}
