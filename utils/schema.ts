import { z } from "zod";

export const wordSchema = z.object({
  thought: z.string(),
  parts: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      originalWord: z.string(),
      origin: z.string(),
      meaning: z.string(),
    })
  ),
  combinations: z
    .array(
      z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            definition: z.string(),
            sourceIds: z.array(z.string()),
            origin: z.string().optional(),
          })
        )
        .nonempty()
    )
    .nonempty(),
  similarWords: z.array(
    z.object({
      word: z.string(),
      explanation: z.string(),
      sharedOrigin: z.string(),
    })
  ).length(3),
});
