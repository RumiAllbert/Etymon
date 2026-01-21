"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Home,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { Morpheme } from "@/utils/schema";
import Spinner from "@/components/spinner";

async function fetchMorpheme(morpheme: string): Promise<Morpheme> {
  const response = await fetch("/api/morpheme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ morpheme }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch morpheme");
  }

  return response.json();
}

const COMMON_MORPHEMES = {
  prefixes: [
    { morpheme: "anti-", meaning: "against" },
    { morpheme: "auto-", meaning: "self" },
    { morpheme: "bio-", meaning: "life" },
    { morpheme: "co-", meaning: "together" },
    { morpheme: "dis-", meaning: "not, opposite" },
    { morpheme: "geo-", meaning: "earth" },
    { morpheme: "hyper-", meaning: "over, excessive" },
    { morpheme: "inter-", meaning: "between" },
    { morpheme: "micro-", meaning: "small" },
    { morpheme: "multi-", meaning: "many" },
    { morpheme: "neo-", meaning: "new" },
    { morpheme: "poly-", meaning: "many" },
    { morpheme: "pre-", meaning: "before" },
    { morpheme: "pseudo-", meaning: "false" },
    { morpheme: "re-", meaning: "again" },
    { morpheme: "sub-", meaning: "under" },
    { morpheme: "super-", meaning: "above" },
    { morpheme: "tele-", meaning: "far" },
    { morpheme: "trans-", meaning: "across" },
    { morpheme: "un-", meaning: "not" },
  ],
  suffixes: [
    { morpheme: "-able/-ible", meaning: "capable of" },
    { morpheme: "-ation/-tion", meaning: "action or process" },
    { morpheme: "-er/-or", meaning: "one who" },
    { morpheme: "-ful", meaning: "full of" },
    { morpheme: "-ism", meaning: "belief or practice" },
    { morpheme: "-ist", meaning: "one who practices" },
    { morpheme: "-ity/-ty", meaning: "state of" },
    { morpheme: "-less", meaning: "without" },
    { morpheme: "-logy", meaning: "study of" },
    { morpheme: "-ment", meaning: "result of" },
    { morpheme: "-ness", meaning: "state of being" },
    { morpheme: "-ous/-ious", meaning: "having quality of" },
    { morpheme: "-phobia", meaning: "fear of" },
    { morpheme: "-ship", meaning: "state or condition" },
  ],
  roots: [
    { morpheme: "graph", meaning: "write" },
    { morpheme: "phon", meaning: "sound" },
    { morpheme: "port", meaning: "carry" },
    { morpheme: "scrib/script", meaning: "write" },
    { morpheme: "spec/spect", meaning: "look" },
    { morpheme: "struct", meaning: "build" },
    { morpheme: "dict", meaning: "say" },
    { morpheme: "duct", meaning: "lead" },
    { morpheme: "fac/fact", meaning: "make" },
    { morpheme: "ject", meaning: "throw" },
    { morpheme: "mit/miss", meaning: "send" },
    { morpheme: "ped/pod", meaning: "foot" },
    { morpheme: "phil", meaning: "love" },
    { morpheme: "psych", meaning: "mind" },
    { morpheme: "rupt", meaning: "break" },
    { morpheme: "vers/vert", meaning: "turn" },
    { morpheme: "vid/vis", meaning: "see" },
    { morpheme: "voc/vok", meaning: "call" },
  ],
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "prefix":
      return "dark:bg-blue-500/20 bg-blue-500/10 dark:text-blue-300 text-blue-600";
    case "suffix":
      return "dark:bg-purple-500/20 bg-purple-500/10 dark:text-purple-300 text-purple-600";
    case "root":
      return "dark:bg-green-500/20 bg-green-500/10 dark:text-green-300 text-green-600";
    default:
      return "dark:bg-gray-500/20 bg-gray-500/10 dark:text-gray-300 text-gray-600";
  }
};

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMorpheme, setSelectedMorpheme] = useState<string | null>(null);

  const {
    data: morphemeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["morpheme", selectedMorpheme],
    queryFn: () => fetchMorpheme(selectedMorpheme!),
    enabled: !!selectedMorpheme,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      setSelectedMorpheme(searchTerm);
    }
  };

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
            <BookOpen className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl font-serif">Root Explorer</h1>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a prefix, suffix, or root..."
              className="flex-1 px-4 py-3 rounded-lg dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Morpheme lists */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prefixes */}
            <div>
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                    "prefix"
                  )}`}
                >
                  Prefixes
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COMMON_MORPHEMES.prefixes.map((item) => (
                  <button
                    key={item.morpheme}
                    onClick={() => setSelectedMorpheme(item.morpheme)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedMorpheme === item.morpheme
                        ? "dark:bg-blue-500/20 bg-blue-100 border-blue-500"
                        : "dark:bg-gray-800/50 bg-gray-50/50 hover:dark:bg-gray-700/50 hover:bg-gray-100/50"
                    } border dark:border-gray-700/50 border-gray-200/50`}
                  >
                    <span className="font-medium">{item.morpheme}</span>
                    <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                      {item.meaning}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Roots */}
            <div>
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                    "root"
                  )}`}
                >
                  Roots
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COMMON_MORPHEMES.roots.map((item) => (
                  <button
                    key={item.morpheme}
                    onClick={() => setSelectedMorpheme(item.morpheme)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedMorpheme === item.morpheme
                        ? "dark:bg-green-500/20 bg-green-100 border-green-500"
                        : "dark:bg-gray-800/50 bg-gray-50/50 hover:dark:bg-gray-700/50 hover:bg-gray-100/50"
                    } border dark:border-gray-700/50 border-gray-200/50`}
                  >
                    <span className="font-medium">{item.morpheme}</span>
                    <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                      {item.meaning}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Suffixes */}
            <div>
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                    "suffix"
                  )}`}
                >
                  Suffixes
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COMMON_MORPHEMES.suffixes.map((item) => (
                  <button
                    key={item.morpheme}
                    onClick={() => setSelectedMorpheme(item.morpheme)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedMorpheme === item.morpheme
                        ? "dark:bg-purple-500/20 bg-purple-100 border-purple-500"
                        : "dark:bg-gray-800/50 bg-gray-50/50 hover:dark:bg-gray-700/50 hover:bg-gray-100/50"
                    } border dark:border-gray-700/50 border-gray-200/50`}
                  >
                    <span className="font-medium">{item.morpheme}</span>
                    <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                      {item.meaning}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {isLoading ? (
                <div className="p-8 rounded-xl dark:bg-gray-800/50 bg-gray-50/50 flex items-center justify-center">
                  <Spinner variant="roots" />
                </div>
              ) : error ? (
                <div className="p-8 rounded-xl dark:bg-gray-800/50 bg-gray-50/50 text-center">
                  <p className="text-red-500">Failed to load morpheme data</p>
                </div>
              ) : morphemeData ? (
                <div className="p-6 rounded-xl dark:bg-gray-800/50 bg-gray-50/50 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-serif">
                        {morphemeData.morpheme}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                          morphemeData.type
                        )}`}
                      >
                        {morphemeData.type}
                      </span>
                    </div>
                    {morphemeData.originalForm && (
                      <p className="text-sm text-gray-500">
                        Original: {morphemeData.originalForm}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg dark:bg-gray-900/50 bg-gray-100/50">
                    <p className="font-medium">{morphemeData.meaning}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      From {morphemeData.origin}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium dark:text-gray-400 text-gray-500 mb-2">
                      Example Words
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {morphemeData.examples.map((example, i) => (
                        <Link
                          key={i}
                          href={`/word/${encodeURIComponent(example)}`}
                          className="px-3 py-1 rounded-full text-sm dark:bg-gray-700/50 bg-gray-200/50 hover:dark:bg-gray-600/50 hover:bg-gray-300/50 transition-colors flex items-center gap-1"
                        >
                          {example}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {morphemeData.relatedMorphemes &&
                    morphemeData.relatedMorphemes.length > 0 && (
                      <div className="pt-4 border-t dark:border-gray-700/50 border-gray-200/50">
                        <h4 className="text-sm font-medium dark:text-gray-400 text-gray-500 mb-2">
                          Related Morphemes
                        </h4>
                        <div className="space-y-2">
                          {morphemeData.relatedMorphemes.map((related, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                setSelectedMorpheme(related.morpheme)
                              }
                              className="w-full p-2 rounded-lg dark:bg-gray-900/30 bg-gray-100/30 hover:dark:bg-gray-900/50 hover:bg-gray-200/50 text-left transition-colors"
                            >
                              <span className="font-medium">
                                {related.morpheme}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                - {related.meaning}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-8 rounded-xl dark:bg-gray-800/30 bg-gray-50/30 border-2 border-dashed dark:border-gray-700 border-gray-300 text-center">
                  <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Select a morpheme to see details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
