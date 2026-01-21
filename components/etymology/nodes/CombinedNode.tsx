"use client";

import { Handle, Position } from "@xyflow/react";
import { useAtom } from "jotai";
import { Clock, Globe, Volume2 } from "lucide-react";
import {
  isLoadingAtom,
  showTimelinePanelAtom,
  timelineWordAtom,
  showCognatesPanelAtom,
  cognatesWordAtom,
} from "../utils/atoms";
import { getOriginColor } from "../utils/helpers";

interface CombinedNodeProps {
  data: {
    text: string;
    definition: string;
    origin?: string;
  };
}

export default function CombinedNode({ data }: CombinedNodeProps) {
  const [isLoading] = useAtom(isLoadingAtom);
  const [, setShowTimeline] = useAtom(showTimelinePanelAtom);
  const [, setTimelineWord] = useAtom(timelineWordAtom);
  const [, setShowCognates] = useAtom(showCognatesPanelAtom);
  const [, setCognatesWord] = useAtom(cognatesWordAtom);
  const colorClass = data.origin ? getOriginColor(data.origin) : "";

  const handleTimeline = () => {
    setTimelineWord(data.text);
    setShowTimeline(true);
  };

  const handleCognates = () => {
    setCognatesWord(data.text);
    setShowCognates(true);
  };

  const handlePronounce = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(data.text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`flex flex-col items-stretch transition-all duration-1000 ${
        isLoading ? "opacity-0 blur-[20px]" : ""
      }`}
    >
      <div className="px-4 py-2 rounded-lg dark:bg-gray-800 bg-white dark:border-gray-700/50 border-gray-200/50 border min-w-fit max-w-[250px] group">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 w-full">
            <p className="text-xl font-serif mb-1 whitespace-nowrap dark:text-gray-100 text-gray-900 flex-1">
              {data.text}
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
            </div>
          </div>
          {data.origin && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass} mb-1`}
            >
              {data.origin}
            </span>
          )}
          <p className="text-sm dark:text-gray-300 text-gray-700 w-full">
            {data.definition}
          </p>
        </div>
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
