"use client";

import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { Clock, ChevronRight } from "lucide-react";
import { showTimelinePanelAtom, timelineWordAtom } from "../utils/atoms";
import { getOriginColor } from "../utils/helpers";
import type { Timeline } from "@/utils/schema";
import Spinner from "@/components/spinner";
import DraggablePanel from "./DraggablePanel";

interface TimelinePanelProps {
  word?: string;
}

async function fetchTimeline(word: string): Promise<Timeline> {
  const response = await fetch("/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch timeline");
  }

  return response.json();
}

export default function TimelinePanel({ word }: TimelinePanelProps) {
  const [showTimeline, setShowTimeline] = useAtom(showTimelinePanelAtom);
  const [timelineWord, setTimelineWord] = useAtom(timelineWordAtom);

  const activeWord = word || timelineWord;

  const { data: timeline, isLoading, error } = useQuery({
    queryKey: ["timeline", activeWord],
    queryFn: () => fetchTimeline(activeWord!),
    enabled: !!activeWord && showTimeline,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const handleClose = () => {
    setShowTimeline(false);
    setTimelineWord(null);
  };

  if (!showTimeline || !activeWord) return null;

  return (
    <DraggablePanel
      title="Etymology Timeline"
      icon={<Clock className="w-5 h-5 text-purple-500" />}
      onClose={handleClose}
      className="fixed right-4 top-20 w-[420px] max-h-[80vh] dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex flex-col flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="wordTree" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load timeline</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : timeline ? (
          <div className="overflow-y-auto flex-1 space-y-4">
            {/* Word header */}
            <div className="text-center pb-4 border-b dark:border-gray-700/50 border-gray-200/50">
              <h3 className="text-2xl font-serif">{timeline.word}</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mt-2">
                {timeline.summary}
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 dark:bg-gray-700 bg-gray-300" />

              {/* Timeline events */}
              <div className="space-y-6">
                {timeline.events.map((event, i) => (
                  <div key={event.id} className="relative pl-10">
                    {/* Dot */}
                    <div
                      className={`absolute left-2 top-2 w-4 h-4 rounded-full border-2 dark:border-gray-800 border-white ${
                        i === timeline.events.length - 1
                          ? "bg-blue-500"
                          : "dark:bg-gray-600 bg-gray-400"
                      }`}
                    />

                    {/* Content */}
                    <div className="p-3 rounded-lg dark:bg-gray-900/50 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOriginColor(
                            event.language
                          )}`}
                        >
                          {event.language}
                        </span>
                        <span className="text-xs dark:text-gray-500 text-gray-500">
                          {event.year}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-serif">{event.word}</span>
                        {event.pronunciation && (
                          <span className="text-sm text-gray-500">
                            /{event.pronunciation}/
                          </span>
                        )}
                      </div>

                      <p className="text-sm dark:text-gray-300 text-gray-700">
                        "{event.meaning}"
                      </p>

                      {event.notes && (
                        <p className="text-xs dark:text-gray-500 text-gray-500 mt-2 italic">
                          {event.notes}
                        </p>
                      )}
                    </div>

                    {/* Arrow to next */}
                    {i < timeline.events.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ChevronRight className="w-4 h-4 text-gray-500 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DraggablePanel>
  );
}
