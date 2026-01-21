import { z } from "zod";

// Base part schema for word components
export const partSchema = z.object({
  id: z.string(),
  text: z.string(),
  originalWord: z.string(),
  origin: z.string(),
  meaning: z.string(),
});

// Combination schema for word combinations
export const combinationSchema = z.object({
  id: z.string(),
  text: z.string(),
  definition: z.string(),
  sourceIds: z.array(z.string()),
  origin: z.string().optional(),
});

// Similar word schema
export const similarWordSchema = z.object({
  word: z.string(),
  explanation: z.string(),
  sharedOrigin: z.string(),
});

// Main word schema (existing)
export const wordSchema = z.object({
  thought: z.string(),
  parts: z.array(partSchema),
  combinations: z.array(z.array(combinationSchema).nonempty()).nonempty(),
  similarWords: z.array(similarWordSchema).min(1).max(3),
});

// Timeline event schema
export const timelineEventSchema = z.object({
  id: z.string(),
  period: z.string(), // e.g., "Ancient Greek", "Latin", "Old French", "Middle English", "Modern English"
  year: z.string(), // e.g., "800 BCE", "100 CE", "1200", "1500", "present"
  word: z.string(), // The word form in that period
  pronunciation: z.string().optional(), // IPA pronunciation
  meaning: z.string(), // Meaning in that period
  notes: z.string().optional(), // Additional historical notes
  language: z.string(), // Language name
});

// Etymology timeline schema
export const timelineSchema = z.object({
  word: z.string(),
  events: z.array(timelineEventSchema).min(2),
  summary: z.string(), // Brief summary of the word's journey
});

// Cognate schema for cross-language connections
export const cognateSchema = z.object({
  word: z.string(),
  language: z.string(),
  languageCode: z.string(), // ISO 639-1 code
  pronunciation: z.string().optional(), // IPA
  meaning: z.string(),
  script: z.string().optional(), // Original script if different (e.g., Cyrillic)
  relationship: z.enum(["direct", "indirect", "false_friend"]),
});

// Cognates response schema
export const cognatesResponseSchema = z.object({
  sourceWord: z.string(),
  sourceLanguage: z.string(),
  protoRoot: z.string().optional(), // Proto-Indo-European root if applicable
  protoMeaning: z.string().optional(),
  cognates: z.array(cognateSchema).min(1),
  languageFamilyTree: z.string().optional(), // Description of language family
});

// Word family member schema
export const wordFamilyMemberSchema = z.object({
  word: z.string(),
  partOfSpeech: z.string(), // noun, verb, adjective, etc.
  meaning: z.string(),
  relationship: z.string(), // e.g., "derived from", "shares root", "compound"
  commonRoot: z.string(), // The shared root/morpheme
});

// Word family schema
export const wordFamilySchema = z.object({
  root: z.string(), // The root being explored
  rootMeaning: z.string(),
  rootOrigin: z.string(), // e.g., "Ancient Greek"
  originalForm: z.string().optional(), // Original script if applicable
  members: z.array(wordFamilyMemberSchema).min(3).max(20),
  relatedRoots: z
    .array(
      z.object({
        root: z.string(),
        meaning: z.string(),
        connection: z.string(),
      })
    )
    .optional(),
});

// Root/Prefix/Suffix explorer schemas
export const morphemeTypeSchema = z.enum(["prefix", "suffix", "root"]);

export const morphemeSchema = z.object({
  morpheme: z.string(),
  type: morphemeTypeSchema,
  meaning: z.string(),
  origin: z.string(),
  originalForm: z.string().optional(),
  examples: z.array(z.string()).min(3).max(10),
  relatedMorphemes: z
    .array(
      z.object({
        morpheme: z.string(),
        meaning: z.string(),
        type: morphemeTypeSchema,
      })
    )
    .optional(),
});

// Quiz question schemas
export const quizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "guess_origin",
    "match_meaning",
    "word_family",
    "fill_blank",
    "true_false",
  ]),
  question: z.string(),
  word: z.string().optional(),
  options: z.array(z.string()).min(2).max(4),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number(),
});

export const quizSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  questions: z.array(quizQuestionSchema).min(5).max(20),
  timeLimit: z.number().optional(), // in seconds
});

// Achievement schema
export const achievementTypeSchema = z.enum([
  "first_word",
  "word_collector_10",
  "word_collector_50",
  "word_collector_100",
  "streak_3",
  "streak_7",
  "streak_30",
  "quiz_perfect",
  "quiz_master",
  "root_explorer",
  "language_polyglot",
  "timeline_traveler",
  "collection_creator",
  "sharing_is_caring",
]);

export const achievementSchema = z.object({
  type: achievementTypeSchema,
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  unlockedAt: z.string().optional(),
});

// Word of the Day schema
export const wordOfTheDaySchema = z.object({
  word: z.string(),
  definition: wordSchema,
  funFact: z.string().optional(),
  usageExample: z.string().optional(),
  featuredDate: z.string(),
});

// Export types
export type Part = z.infer<typeof partSchema>;
export type Combination = z.infer<typeof combinationSchema>;
export type SimilarWord = z.infer<typeof similarWordSchema>;
export type Definition = z.infer<typeof wordSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
export type Cognate = z.infer<typeof cognateSchema>;
export type CognatesResponse = z.infer<typeof cognatesResponseSchema>;
export type WordFamilyMember = z.infer<typeof wordFamilyMemberSchema>;
export type WordFamily = z.infer<typeof wordFamilySchema>;
export type MorphemeType = z.infer<typeof morphemeTypeSchema>;
export type Morpheme = z.infer<typeof morphemeSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type AchievementType = z.infer<typeof achievementTypeSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type WordOfTheDay = z.infer<typeof wordOfTheDaySchema>;
