"use client";

import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { showWordFamilyAtom, currentRootAtom, inputValueAtom, isLoadingAtom } from "../utils/atoms";
import { getOriginColor } from "../utils/helpers";
import type { WordFamily } from "@/utils/schema";
import Spinner from "@/components/spinner";
import DraggablePanel from "./DraggablePanel";

interface WordFamilyPanelProps {
  onWordClick: (word: string) => Promise<void>;
}

async function fetchWordFamily(root: string): Promise<WordFamily> {
  const response = await fetch("/api/word-family", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ root }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch word family");
  }

  return response.json();
}

export default function WordFamilyPanel({ onWordClick }: WordFamilyPanelProps) {
  const [showWordFamily, setShowWordFamily] = useAtom(showWordFamilyAtom);
  const [currentRoot, setCurrentRoot] = useAtom(currentRootAtom);
  const [, setInputValue] = useAtom(inputValueAtom);
  const [isLoading] = useAtom(isLoadingAtom);

  const { data: wordFamily, isLoading: isFetching, error } = useQuery({
    queryKey: ["wordFamily", currentRoot],
    queryFn: () => fetchWordFamily(currentRoot!),
    enabled: !!currentRoot && showWordFamily,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const handleWordClick = async (word: string) => {
    setShowWordFamily(false);
    setCurrentRoot(null);
    setInputValue(word);
    await onWordClick(word);
  };

  const handleClose = () => {
    setShowWordFamily(false);
    setCurrentRoot(null);
  };

  if (!showWordFamily || !currentRoot) return null;

  return (
    <DraggablePanel
      title="Word Family"
      icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
      onClose={handleClose}
      className="fixed left-4 top-20 w-96 max-h-[80vh] dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex flex-col flex-1 min-h-0">
        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="roots" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load word family</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : wordFamily ? (
          <div className="overflow-y-auto flex-1 space-y-4">
            {/* Root info */}
            <div className="p-4 rounded-lg dark:bg-gray-900/50 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-serif">{wordFamily.root}</span>
                {wordFamily.originalForm && (
                  <span className="text-lg text-gray-500">
                    ({wordFamily.originalForm})
                  </span>
                )}
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOriginColor(
                  wordFamily.rootOrigin
                )}`}
              >
                {wordFamily.rootOrigin}
              </span>
              <p className="mt-2 text-sm dark:text-gray-300 text-gray-700">
                {wordFamily.rootMeaning}
              </p>
            </div>

            {/* Word family members */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium dark:text-gray-400 text-gray-500">
                Words in this family ({wordFamily.members.length})
              </h3>
              <div className="space-y-2">
                {wordFamily.members.map((member, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg dark:bg-gray-900/30 bg-gray-50/30 hover:dark:bg-gray-900/50 hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleWordClick(member.word)}
                        disabled={isLoading}
                        className="text-lg font-serif dark:text-blue-400 text-blue-600 hover:dark:text-blue-300 hover:text-blue-500 transition-colors text-left disabled:opacity-50"
                      >
                        {member.word}
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded dark:bg-gray-700/50 bg-gray-200/50">
                        {member.partOfSpeech}
                      </span>
                    </div>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                      {member.meaning}
                    </p>
                    <p className="text-xs dark:text-gray-500 text-gray-500 mt-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      {member.relationship}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related roots */}
            {wordFamily.relatedRoots && wordFamily.relatedRoots.length > 0 && (
              <div className="space-y-2 pt-4 border-t dark:border-gray-700/50 border-gray-200/50">
                <h3 className="text-sm font-medium dark:text-gray-400 text-gray-500">
                  Related Roots
                </h3>
                <div className="space-y-2">
                  {wordFamily.relatedRoots.map((related, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentRoot(related.root)}
                      className="w-full p-2 rounded-lg dark:bg-gray-900/30 bg-gray-50/30 hover:dark:bg-gray-900/50 hover:bg-gray-100/50 transition-colors text-left"
                    >
                      <span className="font-medium">{related.root}</span>
                      <span className="text-sm dark:text-gray-400 text-gray-600 ml-2">
                        - {related.meaning}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DraggablePanel>
  );
}
