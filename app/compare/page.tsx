"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Search,
  Home,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Definition } from "@/utils/schema";
import Spinner from "@/components/spinner";

async function fetchWord(word: string): Promise<Definition> {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch word");
  }

  return response.json();
}

const getOriginColor = (origin: string): string => {
  const lowerOrigin = origin.toLowerCase();
  if (lowerOrigin.includes("greek"))
    return "dark:bg-green-500/20 bg-green-500/10 dark:text-green-300 text-green-600";
  if (lowerOrigin.includes("latin"))
    return "dark:bg-red-500/20 bg-red-500/10 dark:text-red-300 text-red-600";
  if (lowerOrigin.includes("french"))
    return "dark:bg-purple-500/20 bg-purple-500/10 dark:text-purple-300 text-purple-600";
  if (lowerOrigin.includes("german") || lowerOrigin.includes("germanic"))
    return "dark:bg-yellow-500/20 bg-yellow-500/10 dark:text-yellow-300 text-yellow-600";
  return "dark:bg-gray-500/20 bg-gray-500/10 dark:text-gray-300 text-gray-600";
};

function WordCard({
  definition,
  word,
}: {
  definition: Definition;
  word: string;
}) {
  const lastLayer = definition.combinations[definition.combinations.length - 1];
  const finalWord = lastLayer?.[0];

  return (
    <div className="flex-1 p-6 rounded-xl dark:bg-gray-800/50 bg-gray-50/50 space-y-4">
      {/* Word header */}
      <div className="text-center pb-4 border-b dark:border-gray-700/50 border-gray-200/50">
        <h2 className="text-3xl font-serif">{word}</h2>
        {finalWord && (
          <p className="text-sm dark:text-gray-400 text-gray-600 mt-2">
            {finalWord.definition}
          </p>
        )}
      </div>

      {/* Etymology thought */}
      <div className="p-4 rounded-lg dark:bg-gray-900/50 bg-gray-100/50">
        <p className="text-sm">{definition.thought}</p>
      </div>

      {/* Word parts */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium dark:text-gray-400 text-gray-500">
          Word Parts
        </h3>
        <div className="space-y-2">
          {definition.parts.map((part) => (
            <div
              key={part.id}
              className="p-3 rounded-lg dark:bg-gray-900/30 bg-gray-100/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif text-lg">{part.text}</span>
                <span className="text-sm text-gray-500">
                  ({part.originalWord})
                </span>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOriginColor(
                  part.origin
                )}`}
              >
                {part.origin}
              </span>
              <p className="text-sm dark:text-gray-400 text-gray-600 mt-2">
                {part.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Similar words */}
      <div className="space-y-2 pt-4 border-t dark:border-gray-700/50 border-gray-200/50">
        <h3 className="text-sm font-medium dark:text-gray-400 text-gray-500">
          Related Words
        </h3>
        <div className="flex flex-wrap gap-2">
          {definition.similarWords.map((similar, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-sm dark:bg-gray-700/50 bg-gray-200/50"
            >
              {similar.word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [searchWord1, setSearchWord1] = useState("");
  const [searchWord2, setSearchWord2] = useState("");

  const {
    data: definition1,
    isLoading: isLoading1,
    error: error1,
  } = useQuery({
    queryKey: ["word", searchWord1],
    queryFn: () => fetchWord(searchWord1),
    enabled: !!searchWord1,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: definition2,
    isLoading: isLoading2,
    error: error2,
  } = useQuery({
    queryKey: ["word", searchWord2],
    queryFn: () => fetchWord(searchWord2),
    enabled: !!searchWord2,
    staleTime: 5 * 60 * 1000,
  });

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchWord1(word1);
    setSearchWord2(word2);
  };

  // Find shared origins between the two words
  const findSharedOrigins = () => {
    if (!definition1 || !definition2) return [];

    const origins1 = new Set(
      definition1.parts.map((p) => p.origin.toLowerCase())
    );
    const origins2 = new Set(
      definition2.parts.map((p) => p.origin.toLowerCase())
    );

    return Array.from(origins1).filter((origin) => origins2.has(origin));
  };

  const sharedOrigins = findSharedOrigins();

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-white dark:text-gray-100 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Etymon</span>
          </Link>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-serif">Compare Words</h1>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleCompare} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-2">
                First Word
              </label>
              <input
                type="text"
                value={word1}
                onChange={(e) => setWord1(e.target.value)}
                placeholder="Enter first word"
                className="w-full px-4 py-3 rounded-lg dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="hidden md:block pt-8">
              <ArrowLeftRight className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-2">
                Second Word
              </label>
              <input
                type="text"
                value={word2}
                onChange={(e) => setWord2(e.target.value)}
                placeholder="Enter second word"
                className="w-full px-4 py-3 rounded-lg dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="pt-0 md:pt-8">
              <button
                type="submit"
                disabled={!word1 || !word2 || isLoading1 || isLoading2}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Compare
              </button>
            </div>
          </div>
        </form>

        {/* Shared origins indicator */}
        {definition1 && definition2 && sharedOrigins.length > 0 && (
          <div className="mb-8 p-4 rounded-xl dark:bg-green-500/10 bg-green-50 border dark:border-green-500/20 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              <span className="font-medium dark:text-green-400 text-green-600">
                Shared Origins Found!
              </span>
            </div>
            <p className="text-sm dark:text-green-300 text-green-700">
              Both words share roots from:{" "}
              {sharedOrigins.map((o) => o.charAt(0).toUpperCase() + o.slice(1)).join(", ")}
            </p>
          </div>
        )}

        {/* Comparison view */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Word 1 */}
          <div className="flex-1">
            {isLoading1 ? (
              <div className="flex items-center justify-center py-20 rounded-xl dark:bg-gray-800/50 bg-gray-50/50">
                <Spinner variant="roots" />
              </div>
            ) : error1 ? (
              <div className="text-center py-20 rounded-xl dark:bg-gray-800/50 bg-gray-50/50">
                <p className="text-red-500">Failed to load "{searchWord1}"</p>
              </div>
            ) : definition1 ? (
              <WordCard definition={definition1} word={searchWord1} />
            ) : (
              <div className="flex items-center justify-center py-20 rounded-xl dark:bg-gray-800/30 bg-gray-50/30 border-2 border-dashed dark:border-gray-700 border-gray-300">
                <p className="text-gray-500">Enter the first word to compare</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden md:flex items-center">
            <div className="w-px h-full dark:bg-gray-700 bg-gray-300" />
          </div>

          {/* Word 2 */}
          <div className="flex-1">
            {isLoading2 ? (
              <div className="flex items-center justify-center py-20 rounded-xl dark:bg-gray-800/50 bg-gray-50/50">
                <Spinner variant="roots" />
              </div>
            ) : error2 ? (
              <div className="text-center py-20 rounded-xl dark:bg-gray-800/50 bg-gray-50/50">
                <p className="text-red-500">Failed to load "{searchWord2}"</p>
              </div>
            ) : definition2 ? (
              <WordCard definition={definition2} word={searchWord2} />
            ) : (
              <div className="flex items-center justify-center py-20 rounded-xl dark:bg-gray-800/30 bg-gray-50/30 border-2 border-dashed dark:border-gray-700 border-gray-300">
                <p className="text-gray-500">
                  Enter the second word to compare
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
