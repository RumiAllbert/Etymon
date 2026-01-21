import { generateObject } from "ai";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { wordSchema } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// Define the schema for word parts and combinations

type WordOutput = z.infer<typeof wordSchema>;

export const maxDuration = 30;

function validateWordParts(word: string, parts: WordOutput["parts"]): string[] {
  const errors: string[] = [];
  const combinedParts = parts.map((p) => p.text).join("");
  const commaSeparatedParts = parts.map((p) => p.text).join(", ");

  // More flexible validation for words that might be returned in Greek
  // We'll check if the combined parts contain non-Latin characters
  const hasNonLatinChars = /[^\u0000-\u007F]/.test(combinedParts);

  if (hasNonLatinChars) {
    // For words with non-Latin characters (like Greek), we'll skip the strict validation
    // as the model might return the original Greek form of an English word
    console.log("Word contains non-Latin characters, skipping strict validation");
    return [];
  }

  // For regular Latin-character words, perform the original validation
  if (combinedParts.toLowerCase() !== word.toLowerCase().replaceAll(" ", "")) {
    errors.push(
      `The parts "${commaSeparatedParts}" do not combine to form the word "${word}"`
    );
  }
  return errors;
}

function validateUniqueIds(output: WordOutput): string[] {
  const errors: string[] = [];
  const seenIds = new Map<string, string>(); // id -> where it was found

  // Check parts
  output.parts.forEach((part) => {
    seenIds.set(part.id, "parts");
  });

  // Check combinations
  output.combinations.forEach((layer, layerIndex) => {
    layer.forEach((combo) => {
      if (seenIds.has(combo.id)) {
        errors.push(
          `ID "${combo.id}" in combinations layer ${layerIndex + 1
          } is already used in ${seenIds.get(
            combo.id
          )}. IDs must be unique across both parts and combinations.`
        );
      }
      seenIds.set(combo.id, `combinations layer ${layerIndex + 1}`);
    });
  });

  return errors;
}

function validateCombinations(word: string, output: WordOutput): string[] {
  const errors: string[] = [];

  // Check if last layer has exactly one item
  const lastLayer = output.combinations[output.combinations.length - 1];
  if (lastLayer.length !== 1) {
    errors.push(
      `The last layer should have exactly one item, which should be the original word, but you have ${lastLayer.length} items. You may need to add one more layer and move the final word to the next layer.`
    );
  }

  // Check if last combination is the full word - with more flexibility for Greek words
  if (lastLayer?.length === 1) {
    const finalWord = lastLayer[0].text.toLowerCase();
    const hasNonLatinChars = /[^\u0000-\u007F]/.test(finalWord);

    // For words with non-Latin characters, we'll use a more flexible validation
    if (hasNonLatinChars) {
      // For Greek words, we'll just check if the thought field mentions the search word
      if (!output.thought.toLowerCase().includes(word.toLowerCase())) {
        errors.push(
          `The etymology explanation doesn't mention the search term "${word}". Please ensure the etymology is for the correct word.`
        );
      }
    } else if (finalWord !== word.toLowerCase()) {
      errors.push(
        `The final combination "${finalWord}" does not match the input word "${word}"`
      );
    }
  }

  // Build a map of how many times each ID is used as a source
  const childCount = new Map<string, number>();

  // Initialize counts for all parts
  output.parts.forEach((part) => {
    childCount.set(part.id, 0);
  });

  // Count how many times each ID is used as a source
  output.combinations.forEach((layer) => {
    layer.forEach((combo) => {
      combo.sourceIds.forEach((sourceId) => {
        const count = childCount.get(sourceId) ?? 0;
        childCount.set(sourceId, count + 1);
      });
      // Initialize count for this combination
      childCount.set(combo.id, 0);
    });
  });

  // Check that each node (except the final word) has exactly one child
  for (const [id, count] of childCount.entries()) {
    // Skip the final word as it shouldn't have any children
    if (lastLayer?.length === 1 && id === lastLayer[0].id) continue;

    if (count === 0) {
      errors.push(
        `The node "${id}" is not used as a source for any combinations. Make sure to use it as a source in a future layer.`
      );
    } else if (count > 1) {
      errors.push(
        `The node "${id}" is used ${count} times as a source, but should only be used once. Remove extra uses.`
      );
    }
  }

  // Validate DAG structure
  const allIds = new Set(output.parts.map((p) => p.id));
  for (let i = 0; i < output.combinations.length; i++) {
    const layer = output.combinations[i];
    // Add combination IDs from this layer
    layer.forEach((combo) => allIds.add(combo.id));

    // Check if all sourceIds exist in previous layers
    for (const combo of layer) {
      for (const sourceId of combo.sourceIds) {
        if (!allIds.has(sourceId)) {
          errors.push(
            `The sourceId "${sourceId}" in combination "${combo.id}" does not exist in previous layers.`
          );
        }
      }
    }
  }

  return errors;
}

interface LastAttempt {
  errors: string[];
  output: WordOutput;
}

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json(
        { error: "Please enter a word" },
        { status: 400 }
      );
    }

    const attempts: LastAttempt[] = [];
    const maxAttempts = 3;

    while (attempts.length < maxAttempts) {
      const prompt: string =
        attempts.length === 0
          ? `Deconstruct the word: ${word}`
          : `Deconstruct the word: ${word}

Previous attempts:
${attempts
            .map(
              (attempt, index) => `
Attempt ${index + 1}:
${JSON.stringify(attempt.output, null, 2)}
Errors:
${attempt.errors.map((error) => `- ${error}`).join("\n")}
`
            )
            .join("\n")}

Please fix all the issues and try again.`;

      console.log("prompt", prompt);

      try {
        const result = await generateObject({
          model: google("gemini-3-flash-preview"),
          system: `You are an expert etymology analysis system, specializing in Indo-European languages, particularly:
- Ancient and Modern Greek
- Latin and Romance languages (Spanish, French, Italian, Portuguese, Romanian)
- Germanic languages (English, German, Dutch)
- Their historical interconnections and shared roots

Your task is to break down words into their components and explain their origins with scholarly precision.

Key Requirements:
1. Break words into meaningful morphemes (roots, prefixes, suffixes)
2. Focus on direct etymological connections
3. Provide 1-3 similar words sharing significant roots
4. Keep all explanations brief and precise
5. Never split or add dashes to the main word in the top level display
6. For Greek words or words with Greek origins: Always include original Greek script in originalWord and thought fields

IMPORTANT: When analyzing English words with Greek origins, you should:
- Include the original Greek form in the thought field
- Use Greek script in the originalWord field for Greek components
- Ensure the final word in combinations matches the input word (in English)
- For example, if analyzing "comedy", mention "κωμωδία" (kōmōdía) in the thought field, but keep "Comedy" as the final word

Example 1 (Latin Word):
{
  "thought": "From Latin 'circumscribere', combining 'circum' (around) and 'scribere' (to write). Originally meaning 'to draw a line around, to define, to limit'.",
  "parts": [
    {
      "id": "circum",
      "text": "Circum",
      "originalWord": "circum",
      "origin": "Latin",
      "meaning": "around, about"
    },
    {
      "id": "scribere",
      "text": "scribe",
      "originalWord": "scribere",
      "origin": "Latin",
      "meaning": "to write, draw"
    }
  ],
  "combinations": [
    [
      {
        "id": "circumscribe",
        "text": "Circumscribe",
        "definition": "to draw a line around; to limit or restrict",
        "sourceIds": ["circum", "scribere"]
      }
    ]
  ],
  "similarWords": [
    {
      "word": "describe",
      "explanation": "to write down, from 'de-' (down) + 'scribere'",
      "sharedOrigin": "Latin scribere 'to write'"
    },
    {
      "word": "prescribe",
      "explanation": "to write before/for, from 'prae-' (before) + 'scribere'",
      "sharedOrigin": "Latin scribere 'to write'"
    }
  ]
}

Example 2 (Greek Word):
{
  "thought": "From Ancient Greek 'φιλοσοφία' (philosophia), combining 'φίλος' (philos) 'loving' and 'σοφία' (sophia) 'wisdom'. The concept emerged in ancient Greece as the systematic study of knowledge.",
  "parts": [
    {
      "id": "phil",
      "text": "Φιλο",
      "originalWord": "φίλος",
      "origin": "Ancient Greek",
      "meaning": "loving, fond of"
    },
    {
      "id": "sophia",
      "text": "σοφία",
      "originalWord": "σοφία",
      "origin": "Ancient Greek",
      "meaning": "wisdom, knowledge"
    }
  ],
  "combinations": [
    [
      {
        "id": "philosophia",
        "text": "Φιλοσοφία",
        "definition": "the love or pursuit of wisdom and knowledge",
        "sourceIds": ["phil", "sophia"]
      }
    ]
  ],
  "similarWords": [
    {
      "word": "φιλόλογος",
      "explanation": "one who loves learning/words (philology)",
      "sharedOrigin": "Greek φίλος (philos) 'loving'"
    },
    {
      "word": "φιλάνθρωπος",
      "explanation": "lover of humanity (philanthropy)",
      "sharedOrigin": "Greek φίλος (philos) 'loving'"
    }
  ]
}

Example 3 (English word with Greek origin):
{
  "thought": "From Ancient Greek 'κωμῳδία' (kōmōidía) meaning 'comedy', derived from 'κῶμος' (kômos) 'revelry, merrymaking' and 'ᾠδή' (ōidḗ) 'song'. Entered English through Latin 'comoedia'.",
  "parts": [
    {
      "id": "komos",
      "text": "Com",
      "originalWord": "κῶμος",
      "origin": "Ancient Greek",
      "meaning": "revelry, merrymaking"
    },
    {
      "id": "oide",
      "text": "edy",
      "originalWord": "ᾠδή",
      "origin": "Ancient Greek",
      "meaning": "song, ode"
    }
  ],
  "combinations": [
    [
      {
        "id": "comedy",
        "text": "Comedy",
        "definition": "a dramatic work that is light and humorous in tone with a happy conclusion",
        "sourceIds": ["komos", "oide"]
      }
    ]
  ],
  "similarWords": [
    {
      "word": "tragedy",
      "explanation": "from Greek 'τραγῳδία' (tragōidía), using the same '-edy' ending",
      "sharedOrigin": "Greek ᾠδή (ōidḗ) 'song'"
    },
    {
      "word": "melodrama",
      "explanation": "from Greek 'μέλος' (mélos) 'song' + 'δρᾶμα' (drâma) 'action'",
      "sharedOrigin": "Greek theatrical tradition"
    }
  ]
}

Guidelines:
1. Always show the complete word at the top level without dashes or splits
2. Break down into meaningful components that show clear etymology
3. Ensure each part has a distinct origin and meaning
4. Provide accurate historical connections
5. Keep definitions concise but informative
6. Include only verifiable etymological relationships
7. Use consistent language origin labeling
8. For Greek words or words with Greek origins:
   - Always use original Greek script in originalWord field
   - Use Greek script in text field when appropriate
   - Include both Greek script and transliteration in thought field
   - Show Greek script in similarWords when they're Greek
   - For English words derived from Greek, keep the final combination in English
9. For Romance languages:
   - Trace both direct and Latin origins
   - Show connections to other Romance languages when relevant
10. For English words:
    - Show Germanic roots where applicable
    - Indicate Latin/French influence where relevant
    - Note Greek etymologies where appropriate`,
          prompt,
          schema: wordSchema,
        });

        const errors: string[] = [
          ...validateWordParts(word, result.object.parts),
          ...validateUniqueIds(result.object),
          ...validateCombinations(word, result.object),
        ];

        if (errors.length > 0) {
          console.log("validation errors:", errors);
          attempts.push({
            errors,
            output: result.object,
          });
          continue;
        }

        return NextResponse.json(result.object);
      } catch (error) {
        console.error("Error generating word deconstruction:", error);
        if (error instanceof Error && error.message.includes("timeout")) {
          return NextResponse.json(
            { error: "This word is taking too long to process. Try a simpler word." },
            { status: 408 }
          );
        }
        throw error;
      }
    }

    // Return the last attempt anyway
    return NextResponse.json(attempts[attempts.length - 1]?.output, {
      status: 203,
    });
  } catch (error) {
    console.error("Error generating word deconstruction:", error);
    return NextResponse.json(
      { error: "Unable to process this word. Try another one." },
      { status: 500 }
    );
  }
}
