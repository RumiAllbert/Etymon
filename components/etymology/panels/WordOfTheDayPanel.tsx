"use client";

import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, BookOpen, Quote } from "lucide-react";
import { showWotdPanelAtom } from "../utils/atoms";
import { getOriginColor } from "../utils/helpers";
import type { WordOfTheDay } from "@/utils/schema";
import Spinner from "@/components/spinner";
import DraggablePanel from "./DraggablePanel";

async function fetchWordOfTheDay(): Promise<WordOfTheDay> {
  const response = await fetch("/api/word-of-the-day");

  if (!response.ok) {
    throw new Error("Failed to fetch word of the day");
  }

  return response.json();
}

interface WordOfTheDayPanelProps {
  onWordClick: (word: string) => Promise<void>;
}

export default function WordOfTheDayPanel({ onWordClick }: WordOfTheDayPanelProps) {
  const [showWotd, setShowWotd] = useAtom(showWotdPanelAtom);

  const { data: wotd, isLoading, error } = useQuery({
    queryKey: ["wordOfTheDay"],
    queryFn: fetchWordOfTheDay,
    enabled: showWotd,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - word of the day should be stable all day
  });

  const handleWordClick = async () => {
    if (wotd) {
      setShowWotd(false);
      await onWordClick(wotd.word);
    }
  };

  if (!showWotd) return null;

  return (
    <DraggablePanel
      title="Word of the Day"
      icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
      onClose={() => setShowWotd(false)}
      className="fixed left-4 right-4 sm:left-1/2 sm:right-auto top-1/2 sm:-translate-x-1/2 -translate-y-1/2 w-auto sm:w-[500px] max-h-[80vh] dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex flex-col flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="wordTree" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load word of the day</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : wotd ? (
          <div className="overflow-y-auto flex-1 space-y-4">
            {/* Featured date */}
            <div className="text-center text-sm dark:text-gray-500 text-gray-500">
              {new Date(wotd.featuredDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {/* Word */}
            <div className="text-center py-4">
              <button
                onClick={handleWordClick}
                className="text-4xl font-serif dark:text-blue-400 text-blue-600 hover:dark:text-blue-300 hover:text-blue-500 transition-colors"
              >
                {wotd.word}
              </button>
            </div>

            {/* Etymology summary */}
            <div className="p-4 rounded-lg dark:bg-gray-900/50 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium dark:text-gray-400 text-gray-500">
                  Etymology
                </span>
              </div>
              <p className="text-sm dark:text-gray-300 text-gray-700">
                {wotd.definition.thought}
              </p>
            </div>

            {/* Origins */}
            <div className="flex flex-wrap gap-2 justify-center">
              {wotd.definition.parts.map((part, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg dark:bg-gray-900/30 bg-gray-50/30"
                >
                  <span className="font-serif">{part.text}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getOriginColor(
                      part.origin
                    )}`}
                  >
                    {part.origin}
                  </span>
                </div>
              ))}
            </div>

            {/* Fun fact */}
            {wotd.funFact && (
              <div className="p-4 rounded-lg dark:bg-yellow-500/10 bg-yellow-50 border dark:border-yellow-500/20 border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium dark:text-yellow-400 text-yellow-600">
                    Fun Fact
                  </span>
                </div>
                <p className="text-sm dark:text-yellow-200 text-yellow-800">
                  {wotd.funFact}
                </p>
              </div>
            )}

            {/* Usage example */}
            {wotd.usageExample && (
              <div className="p-4 rounded-lg dark:bg-gray-900/30 bg-gray-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium dark:text-gray-400 text-gray-500">
                    Example
                  </span>
                </div>
                <p className="text-sm dark:text-gray-300 text-gray-700 italic">
                  "{wotd.usageExample}"
                </p>
              </div>
            )}

            {/* Explore button */}
            <div className="pt-4 text-center">
              <button
                onClick={handleWordClick}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Explore Full Etymology
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </DraggablePanel>
  );
}
