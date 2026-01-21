"use client";

import { Handle, Position } from "@xyflow/react";
import { useAtom } from "jotai";
import { Sparkles, Volume2, Clock, Globe } from "lucide-react";
import {
  isLoadingAtom,
  currentRootAtom,
  showWordFamilyAtom,
  showTimelinePanelAtom,
  timelineWordAtom,
  showCognatesPanelAtom,
  cognatesWordAtom,
} from "../utils/atoms";
import { getOriginColor } from "../utils/helpers";

interface OriginNodeProps {
  data: {
    originalWord: string;
    origin: string;
    meaning: string;
    onExploreRoot?: (root: string) => void;
  };
}

export default function OriginNode({ data }: OriginNodeProps) {
  const [isLoading] = useAtom(isLoadingAtom);
  const [, setCurrentRoot] = useAtom(currentRootAtom);
  const [, setShowWordFamily] = useAtom(showWordFamilyAtom);
  const [, setShowTimeline] = useAtom(showTimelinePanelAtom);
  const [, setTimelineWord] = useAtom(timelineWordAtom);
  const [, setShowCognates] = useAtom(showCognatesPanelAtom);
  const [, setCognatesWord] = useAtom(cognatesWordAtom);
  const colorClass = getOriginColor(data.origin);

  const handleExploreRoot = () => {
    setCurrentRoot(data.originalWord);
    setShowWordFamily(true);
    if (data.onExploreRoot) {
      data.onExploreRoot(data.originalWord);
    }
  };

  const handleTimeline = () => {
    setTimelineWord(data.originalWord);
    setShowTimeline(true);
  };

  const handleCognates = () => {
    setCognatesWord(data.originalWord);
    setShowCognates(true);
  };

  const handlePronounce = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(data.originalWord);
      // Try to set appropriate language based on origin
      const origin = data.origin.toLowerCase();
      if (origin.includes("greek")) {
        utterance.lang = "el-GR";
      } else if (origin.includes("latin")) {
        utterance.lang = "la";
      } else if (origin.includes("french")) {
        utterance.lang = "fr-FR";
      } else if (origin.includes("spanish")) {
        utterance.lang = "es-ES";
      } else if (origin.includes("german")) {
        utterance.lang = "de-DE";
      } else if (origin.includes("russian")) {
        utterance.lang = "ru-RU";
      } else {
        utterance.lang = "en-US";
      }
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`flex flex-col items-stretch transition-all duration-1000 ${
        isLoading ? "opacity-0 blur-[20px]" : ""
      }`}
    >
      <div className="px-4 py-2 rounded-lg dark:bg-gray-800 bg-white dark:border-gray-700/50 border-gray-200/50 border min-w-fit max-w-[200px] group">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 w-full">
            <p className="text-lg font-serif mb-1.5 whitespace-nowrap dark:text-gray-100 text-gray-900 flex-1">
              {data.originalWord}
            </p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handlePronounce}
                className="p-1 rounded hover:bg-gray-700/30 transition-colors"
                title="Pronounce"
              >
                <Volume2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleTimeline}
                className="p-1 rounded hover:bg-gray-700/30 transition-colors"
                title="View timeline"
              >
                <Clock className="w-3 h-3 text-purple-400" />
              </button>
              <button
                onClick={handleCognates}
                className="p-1 rounded hover:bg-gray-700/30 transition-colors"
                title="View cognates"
              >
                <Globe className="w-3 h-3 text-cyan-400" />
              </button>
              <button
                onClick={handleExploreRoot}
                className="p-1 rounded hover:bg-gray-700/30 transition-colors"
                title="Explore word family"
              >
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </button>
            </div>
          </div>
          <div className="-ml-1">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}
            >
              {data.origin}
            </span>
          </div>
          <p className="text-xs dark:text-gray-300 text-gray-700 w-full mt-2">
            {data.meaning}
          </p>
        </div>
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
