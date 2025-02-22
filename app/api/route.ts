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

export const maxDuration = 60;

function validateWordParts(word: string, parts: WordOutput["parts"]): string[] {
  const errors: string[] = [];
  const combinedParts = parts.map((p) => p.text).join("");
  const commaSeparatedParts = parts.map((p) => p.text).join(", ");

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
          `ID "${combo.id}" in combinations layer ${
            layerIndex + 1
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

  // Check if last combination is the full word
  if (lastLayer?.length === 1) {
    const finalWord = lastLayer[0].text.toLowerCase();
    if (finalWord !== word.toLowerCase()) {
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

function simplifyDAG(output: WordOutput): WordOutput {
  // Create a map of all nodes (parts and combinations) and their dependencies
  const nodeMap = new Map<string, Set<string>>();

  // Initialize with parts
  output.parts.forEach((part) => {
    nodeMap.set(part.id, new Set());
  });

  // Add combinations and their dependencies
  output.combinations.forEach((layer) => {
    layer.forEach((combo) => {
      nodeMap.set(combo.id, new Set(combo.sourceIds));
    });
  });

  // Function to get all dependencies recursively
  function getAllDependencies(
    id: string,
    visited = new Set<string>()
  ): Set<string> {
    if (visited.has(id)) return new Set();
    visited.add(id);

    const deps = nodeMap.get(id) || new Set();
    const allDeps = new Set(deps);

    for (const dep of deps) {
      const subDeps = getAllDependencies(dep, visited);
      subDeps.forEach((d) => allDeps.add(d));
    }

    return allDeps;
  }

  // Create new optimized layers
  type Combination = {
    id: string;
    text: string;
    definition: string;
    sourceIds: string[];
  };
  type Layer = [Combination, ...Combination[]];
  const newCombinations: Layer[] = [];
  const processed = new Set<string>();
  const partsSet = new Set(output.parts.map((p) => p.id));

  // Start with combinations that only depend on parts
  let currentLayer = output.combinations
    .flat()
    .filter((combo) => combo.sourceIds.every((id) => partsSet.has(id)));

  while (currentLayer.length > 0) {
    // Ensure each layer has at least one combination
    if (currentLayer.length > 0) {
      newCombinations.push([currentLayer[0], ...currentLayer.slice(1)]);
    }
    currentLayer.forEach((combo) => processed.add(combo.id));

    // Find next layer: combinations whose dependencies are all processed
    currentLayer = output.combinations.flat().filter(
      (combo) =>
        !processed.has(combo.id) && // Not already processed
        combo.sourceIds.every((id) => partsSet.has(id) || processed.has(id))
    );
  }

  // If we have no combinations, add an empty layer to satisfy the type
  if (newCombinations.length === 0 && output.combinations.length > 0) {
    const emptyCombination = output.combinations[0][0];
    newCombinations.push([emptyCombination]);
  }

  return {
    ...output,
    combinations: newCombinations as typeof output.combinations,
  };
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
        { error: "Word is required and must be a string" },
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

      let model: string;
      switch (attempts.length) {
        case 0:
          model = "gpt-4o-mini";
          break;
        default:
          model = "gpt-4o";
          break;
      }

      const result = await generateObject({
        model: google("gemini-2.0-flash"),
        system: `You are a linguistic expert specializing in ancient Greek and Latin etymology, with deep knowledge of Indo-European language roots. Your task is to deconstruct words into their meaningful parts, explaining their etymology with a focus on classical origins. Create multiple layers of combinations to form the final meaning of the word.

Schema Requirements:
- thought: Think deeply about the word's classical origins. Focus on tracing it back to ancient Greek or Latin roots where applicable. Consider:
  - The Proto-Indo-European roots if known
  - The path through Greek or Latin to modern usage
  - Any interesting historical or cultural context about how the word evolved
- parts: An array of word parts. The text sections MUST combine exactly to form the original word.
  - id: Lowercase identifier for the word part, no spaces. Must be unique.
  - text: The EXACT section of the input word for this part.
  - originalWord: The oldest traceable form of this part, preferably:
    1. Proto-Indo-European root (if known)
    2. Ancient Greek or Latin root
    3. Other ancient language sources
  - origin: Specific origin like "Proto-Indo-European", "Ancient Greek", "Classical Latin", "Koine Greek", etc.
  - meaning: Detailed meaning of this part in its original context
- combinations: A Directed Acyclic Graph (DAG) showing how the word evolved
  - Each array is a layer in the DAG, showing historical development where possible
  - Each combination should show meaningful steps in the word's evolution
  - For classical compounds, show how each element combined historically
  - Each combination contains:
    - id: Unique lowercase identifier
    - text: The combined text segments
    - definition: Clear definition with classical context
    - sourceIds: Array of ids of parts or combinations that form this
  - The last layer must have exactly one combination (the full word)
- similarWords: Array of exactly 3 related words that share etymology
  - word: The related word
  - explanation: How this word relates to the original
  - sharedOrigin: The common classical root or pattern they share

Example for "philosophy":
{
  "thought": "From Ancient Greek φιλοσοφία (philosophia), combining φίλος (philos) 'loving' and σοφία (sophia) 'wisdom'. The concept emerged in ancient Greece as the 'love of wisdom' and systematic study of fundamental truths.",
  "parts": [
    {
      "id": "phil",
      "text": "phil",
      "originalWord": "φίλος",
      "origin": "Ancient Greek",
      "meaning": "loving, fond of, attracted to"
    },
    {
      "id": "osophy",
      "text": "osophy",
      "originalWord": "σοφία",
      "origin": "Ancient Greek",
      "meaning": "wisdom, knowledge, expertise"
    }
  ],
  "combinations": [
    [
      {
        "id": "philosophy",
        "text": "philosophy",
        "definition": "the love or pursuit of wisdom and knowledge",
        "sourceIds": ["phil", "osophy"]
      }
    ]
  ],
  "similarWords": [
    {
      "word": "philology",
      "explanation": "The study of language and literature, literally 'love of words'",
      "sharedOrigin": "Greek φίλος (philos) 'loving'"
    },
    {
      "word": "sophia",
      "explanation": "Wisdom personified, directly from Greek σοφία",
      "sharedOrigin": "Greek σοφία (sophia) 'wisdom'"
    },
    {
      "word": "philanthropist",
      "explanation": "Lover of humanity, using same phil- prefix",
      "sharedOrigin": "Greek φίλος (philos) 'loving'"
    }
  ]
}`,
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

      // Simplify the DAG before returning
      // const simplifiedResult = simplifyDAG(result.object);
      return NextResponse.json(result.object);
    }

    // Return the last attempt anyway
    return NextResponse.json(attempts[attempts.length - 1]?.output, {
      status: 203,
    });
  } catch (error) {
    console.error("Error generating word deconstruction:", error);
    return NextResponse.json(
      { error: "Failed to generate word deconstruction" },
      { status: 500 }
    );
  }
}
