import { quizSchema } from "@/utils/schema";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export const maxDuration = 30;

const systemPrompt = `You are an expert etymologist creating educational quizzes about word origins.

Create engaging quiz questions that test knowledge of:
1. Word origins (which language a word comes from)
2. Original meanings (what words meant in their source language)
3. Word families (grouping words by shared roots)
4. Morpheme meanings (what prefixes, suffixes, and roots mean)

Guidelines:
1. Make questions challenging but fair
2. Include interesting etymological facts in explanations
3. Vary question difficulty (easy, medium, hard)
4. Use well-known words that have interesting etymologies
5. Ensure correct answers are accurate and verifiable

Question types:
- guess_origin: "What language does 'philosophy' come from?" [Greek, Latin, French, German]
- match_meaning: "What did 'salary' originally mean?" [Salt allowance, Monthly pay, Worker's wage, Food ration]
- word_family: "Which words share a root with 'biology'?" [biography, biography, geology, zoology]
- fill_blank: "The prefix 'tele-' means ___" [far/distant, new, self, around]
- true_false: "The word 'muscle' comes from Latin for 'little mouse'" [True, False]`;

export async function POST(req: Request) {
  try {
    const { type = "mixed", difficulty = "medium", count = 10 } = await req.json();

    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: quizSchema,
      system: systemPrompt,
      prompt: `Generate an etymology quiz with ${count} questions.

Quiz type: ${type === "mixed" ? "Mix of all question types" : type}
Difficulty: ${difficulty}

Create engaging questions that teach interesting etymological facts while testing knowledge.
Each question should have:
1. A clear question
2. 2-4 answer options (one correct)
3. The correct answer
4. An educational explanation
5. Appropriate difficulty level
6. Point value (easy: 10, medium: 20, hard: 30)

Make the quiz fun and educational!`,
    });

    return Response.json(object);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return Response.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
