"use client";

import { Handle, Position } from "@xyflow/react";
import { useAtom } from "jotai";
import { BookOpen } from "lucide-react";
import { isLoadingAtom, showSimilarAtom } from "../utils/atoms";

interface WordChunkNodeProps {
  data: {
    text: string;
    isLastChunk?: boolean;
  };
}

export default function WordChunkNode({ data }: WordChunkNodeProps) {
  const [isLoading] = useAtom(isLoadingAtom);
  const [showSimilar, setShowSimilar] = useAtom(showSimilarAtom);

  return (
    <div
      className={`flex flex-col items-center transition-all duration-1000 ${
        isLoading ? "opacity-0 blur-[20px]" : ""
      }`}
    >
      <div className="relative flex items-center">
        <div className="text-5xl font-serif mb-1 dark:text-gray-100 text-gray-900">
          {data.text}
        </div>
        {data.isLastChunk && (
          <button
            onClick={() => setShowSimilar(!showSimilar)}
            className="absolute -right-8 opacity-50 hover:opacity-100 transition-opacity"
            title={showSimilar ? "Hide similar words" : "Show similar words"}
          >
            <BookOpen className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="w-full h-3 border border-t-0 dark:border-gray-700 border-gray-200" />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
