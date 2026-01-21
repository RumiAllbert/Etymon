"use client";

import { useAtom } from "jotai";
import { useState } from "react";
import { Trash2, ChevronDown, Database, History } from "lucide-react";
import { toast } from "sonner";
import { isLoadingAtom, showHistoryAtom, inputValueAtom } from "../utils/atoms";
import {
  getSearchHistory,
  clearSearchHistory,
  groupHistoryByDate,
} from "../utils/history";
import { clearAllCache } from "../utils/cache";
import { getOriginColor } from "../utils/helpers";
import DraggablePanel from "./DraggablePanel";

interface HistoryPanelProps {
  onWordClick: (word: string) => Promise<void>;
}

export default function HistoryPanel({ onWordClick }: HistoryPanelProps) {
  const [isLoading] = useAtom(isLoadingAtom);
  const [showHistory, setShowHistory] = useAtom(showHistoryAtom);
  const [, setInputValue] = useAtom(inputValueAtom);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const history = getSearchHistory();

  const handleClick = async (word: string) => {
    if (isLoading) return;
    try {
      setShowHistory(false);
      await onWordClick(word);
      setInputValue("");
    } catch {
      toast.error("Failed to look up word from history. Please try again.");
    }
  };

  const toggleItemExpanded = (word: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setShowHistory(false);
    toast.success("Search history cleared");
  };

  const filteredHistory = history.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groupedHistory = groupHistoryByDate(filteredHistory);

  if (!showHistory || history.length === 0) return null;

  return (
    <DraggablePanel
      title="Recent Searches"
      icon={<History className="w-5 h-5 text-gray-500" />}
      onClose={() => setShowHistory(false)}
      className="fixed right-4 top-20 w-96 dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl z-50 max-h-[80vh] flex flex-col"
    >
      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-gray-700/50 border-gray-200/50">
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
        <button
          onClick={clearAllCache}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          title="Clear all cached words"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Clear Cache</span>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg dark:bg-gray-900/50 bg-gray-50/50 dark:border-gray-700/50 border-gray-200/50 border dark:text-gray-100 text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {Object.entries(groupedHistory).map(([group, items]) =>
            items.length > 0 ? (
              <div key={group}>
                <h3 className="text-sm font-medium dark:text-gray-400 text-gray-500 mb-2">
                  {group}
                </h3>
                <div className="space-y-2">
                  {items.map((item, i) => {
                    const isExpanded = expandedItems.has(item.word);
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg dark:bg-gray-900/50 bg-gray-50/50 space-y-2"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleClick(item.word)}
                            disabled={isLoading}
                            className="text-lg font-serif dark:text-blue-400 text-blue-600 hover:dark:text-blue-300 hover:text-blue-500 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {item.word}
                          </button>
                          <button
                            onClick={() => toggleItemExpanded(item.word)}
                            className={`opacity-50 hover:opacity-100 transition-opacity ${
                              isExpanded ? "opacity-100" : ""
                            }`}
                            title={isExpanded ? "Show less" : "Show more"}
                          >
                            <ChevronDown
                              className={`w-5 h-5 transform transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="pt-2 space-y-2 border-t dark:border-gray-700/50 border-gray-200/50">
                            {item.origin && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs dark:text-gray-400 text-gray-500">
                                  Origin:
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOriginColor(
                                    item.origin
                                  )}`}
                                >
                                  {item.origin}
                                </span>
                              </div>
                            )}
                            {item.meaning && (
                              <div>
                                <span className="text-xs dark:text-gray-400 text-gray-500">
                                  Meaning:
                                </span>
                                <p className="text-xs dark:text-gray-300 text-gray-600 mt-1">
                                  {item.meaning}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs dark:text-gray-400 text-gray-500">
                                Last searched:
                              </span>
                              <span className="text-xs dark:text-gray-300 text-gray-600">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    </DraggablePanel>
  );
}
