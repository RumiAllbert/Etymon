"use client";

import { useAtom } from "jotai";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import type { Definition } from "@/utils/schema";
import { isLoadingAtom, showSimilarAtom, inputValueAtom } from "../utils/atoms";
import { addToSearchHistory } from "../utils/history";
import DraggablePanel from "./DraggablePanel";

interface SimilarWordsPanelProps {
  similarWords: Definition["similarWords"];
  onWordClick: (word: string) => Promise<void>;
}

export default function SimilarWordsPanel({
  similarWords,
  onWordClick,
}: SimilarWordsPanelProps) {
  const [isLoading] = useAtom(isLoadingAtom);
  const [showSimilar, setShowSimilar] = useAtom(showSimilarAtom);
  const [, setInputValue] = useAtom(inputValueAtom);

  const handleClick = async (word: string) => {
    if (isLoading) return;
    try {
      setShowSimilar(false);
      await onWordClick(word);
      addToSearchHistory(word);
      setInputValue("");
    } catch {
      toast.error("Failed to look up similar word. Please try again.");
    }
  };

  if (!showSimilar) return null;

  return (
    <DraggablePanel
      title="Similar Words"
      icon={<Layers className="w-5 h-5 text-blue-500" />}
      onClose={() => setShowSimilar(false)}
      className={`fixed right-4 top-20 left-4 sm:left-auto w-auto sm:w-96 dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl z-50 ${
        isLoading ? "opacity-50" : ""
      }`}
    >
      <div className="p-6 space-y-4">
        {similarWords.map((word, i) => (
          <div key={i} className="space-y-1">
            <button
              type="button"
              onClick={() => handleClick(word.word)}
              disabled={isLoading}
              className="text-lg font-serif dark:text-blue-400 text-blue-600 hover:dark:text-blue-300 hover:text-blue-500 transition-colors text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {word.word}
            </button>
            <p className="text-sm dark:text-gray-300 text-gray-700">
              {word.explanation}
            </p>
            <p className="text-xs dark:text-gray-400 text-gray-500">
              From {word.sharedOrigin}
            </p>
          </div>
        ))}
      </div>
    </DraggablePanel>
  );
}
