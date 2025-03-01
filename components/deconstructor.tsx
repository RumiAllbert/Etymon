"use client";
import { wordSchema } from "@/utils/schema";
import {
  Background,
  type Edge,
  Handle,
  type Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { atom, useAtom } from "jotai";
import { BookOpen } from "lucide-react";
import { usePlausible } from "next-plausible";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Spinner from "./spinner";

const isLoadingAtom = atom(false);
const showSimilarAtom = atom(false);
const inputValueAtom = atom("");
const showHistoryAtom = atom(false);
const MAX_CREDITS = 15;
const CREDITS_KEY = "etymon_credits_used";
const CREDITS_TIMESTAMP_KEY = "etymon_credits_timestamp";
const CREDITS_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
export const CACHE_PREFIX = "etymon_cache_";
const CACHE_EXPIRY = 60 * 60 * 1000; // 60 minutes in milliseconds
export const HISTORY_KEY = "etymon_search_history";
const MAX_HISTORY_ITEMS = 10;

function clearAllCache() {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove all cache entries
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
        console.log("Removed cache entry:", key);
      } catch (e) {
        console.error("Error removing cache key:", key, e);
      }
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleared ${keysToRemove.length} cache entries`);
      toast.success(`Cleared ${keysToRemove.length} cached words`);
    } else {
      toast.info("No cached words to clear");
    }
  } catch (error) {
    console.error("Error in clearAllCache:", error);
    toast.error("Failed to clear cache");
  }
}

type SearchHistoryItem = {
  word: string;
  timestamp: number;
  meaning?: string;
  origin?: string;
};

function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error reading search history:", error);
    return [];
  }
}

function addToSearchHistory(word: string, definition?: Definition) {
  if (typeof window === "undefined") return;
  try {
    const history = getSearchHistory();
    const normalizedWord = normalizeWord(word);

    // Find existing entry
    const existingIndex = history.findIndex(
      (item) => normalizeWord(item.word) === normalizedWord
    );

    const newEntry: SearchHistoryItem = {
      word,
      timestamp: Date.now(),
      meaning: definition?.thought || "",
      origin: definition?.parts?.[0]?.origin || "",
    };

    if (existingIndex !== -1) {
      // If we don't have new definition data, preserve the old data
      if (!definition) {
        newEntry.meaning = history[existingIndex].meaning;
        newEntry.origin = history[existingIndex].origin;
      }
      history.splice(existingIndex, 1);
    }

    // Add new entry at the beginning
    const newHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    console.log(
      "Updated search history with:",
      word,
      "definition:",
      !!definition
    );
  } catch (error) {
    console.error("Error updating search history:", error);
  }
}

function isNewInterval(timestamp: number) {
  return Date.now() - timestamp >= CREDITS_INTERVAL;
}

function getCreditsUsed(): number {
  if (typeof window === "undefined") return 0;

  const timestamp = parseInt(
    localStorage.getItem(CREDITS_TIMESTAMP_KEY) || "0",
    10
  );
  if (isNewInterval(timestamp)) {
    // Reset credits if it's a new interval
    localStorage.setItem(CREDITS_KEY, "0");
    localStorage.setItem(CREDITS_TIMESTAMP_KEY, Date.now().toString());
    return 0;
  }

  return parseInt(localStorage.getItem(CREDITS_KEY) || "0", 10);
}

function incrementCreditsUsed() {
  const current = getCreditsUsed();
  localStorage.setItem(CREDITS_KEY, (current + 1).toString());
  localStorage.setItem(CREDITS_TIMESTAMP_KEY, Date.now().toString());
}

const WordChunkNode = ({
  data,
}: {
  data: { text: string; isLastChunk?: boolean };
}) => {
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
};

const getOriginColor = (origin: string) => {
  const lowerOrigin = origin.toLowerCase();
  if (lowerOrigin.includes("greek")) {
    return "dark:bg-green-500/20 bg-green-500/10 dark:text-green-300 text-green-600";
  }
  if (lowerOrigin.includes("latin")) {
    return "dark:bg-red-500/20 bg-red-500/10 dark:text-red-300 text-red-600";
  }
  if (lowerOrigin.includes("spanish") || lowerOrigin.includes("romance")) {
    return "dark:bg-orange-500/20 bg-orange-500/10 dark:text-orange-300 text-orange-600";
  }
  if (lowerOrigin.includes("french")) {
    return "dark:bg-purple-500/20 bg-purple-500/10 dark:text-purple-300 text-purple-600";
  }
  if (lowerOrigin.includes("german") || lowerOrigin.includes("germanic")) {
    return "dark:bg-yellow-500/20 bg-yellow-500/10 dark:text-yellow-300 text-yellow-600";
  }
  if (lowerOrigin.includes("arabic") || lowerOrigin.includes("semitic")) {
    return "dark:bg-cyan-500/20 bg-cyan-500/10 dark:text-cyan-300 text-cyan-600";
  }
  if (lowerOrigin.includes("sanskrit") || lowerOrigin.includes("indo")) {
    return "dark:bg-pink-500/20 bg-pink-500/10 dark:text-pink-300 text-pink-600";
  }
  return "dark:bg-gray-500/20 bg-gray-500/10 dark:text-gray-300 text-gray-600";
};

const OriginNode = ({
  data,
}: {
  data: { originalWord: string; origin: string; meaning: string };
}) => {
  const [isLoading] = useAtom(isLoadingAtom);
  const colorClass = getOriginColor(data.origin);

  return (
    <div
      className={`flex flex-col items-stretch transition-all duration-1000 ${
        isLoading ? "opacity-0 blur-[20px]" : ""
      }`}
    >
      <div className="px-4 py-2 rounded-lg dark:bg-gray-800 bg-white dark:border-gray-700/50 border-gray-200/50 border min-w-fit max-w-[180px]">
        <div className="flex flex-col items-start">
          <p className="text-lg font-serif mb-1.5 whitespace-nowrap dark:text-gray-100 text-gray-900">
            {data.originalWord}
          </p>
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
};

const CombinedNode = ({
  data,
}: {
  data: {
    text: string;
    definition: string;
    origin?: string;
  };
}) => {
  const [isLoading] = useAtom(isLoadingAtom);
  const colorClass = data.origin ? getOriginColor(data.origin) : "";

  return (
    <div
      className={`flex flex-col items-stretch transition-all duration-1000 ${
        isLoading ? "opacity-0 blur-[20px]" : ""
      }`}
    >
      <div className="px-4 py-2 rounded-lg dark:bg-gray-800 bg-white dark:border-gray-700/50 border-gray-200/50 border min-w-fit max-w-[250px]">
        <div className="flex flex-col items-start">
          <p className="text-xl font-serif mb-1 whitespace-nowrap dark:text-gray-100 text-gray-900">
            {data.text}
          </p>
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
};

const useTypingAnimation = (
  words: string[],
  typingSpeed = 150,
  deletingSpeed = 100,
  pauseDuration = 2000
) => {
  const [placeholder, setPlaceholder] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const animateTyping = () => {
      const currentWord = words[wordIndex];

      if (isTyping) {
        if (placeholder.length < currentWord.length) {
          timeout = setTimeout(() => {
            setPlaceholder(currentWord.slice(0, placeholder.length + 1));
          }, typingSpeed);
        } else {
          setIsPaused(true);
          timeout = setTimeout(() => {
            setIsPaused(false);
            setIsTyping(false);
          }, pauseDuration);
        }
      } else {
        if (placeholder.length > 0) {
          timeout = setTimeout(() => {
            setPlaceholder(placeholder.slice(0, -1));
          }, deletingSpeed);
        } else {
          setIsTyping(true);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    timeout = setTimeout(animateTyping, isPaused ? pauseDuration : 0);

    return () => clearTimeout(timeout);
  }, [
    placeholder,
    wordIndex,
    isTyping,
    isPaused,
    words,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  return placeholder;
};

const HistoryPanel = ({
  onWordClick,
}: {
  onWordClick: (word: string) => Promise<void>;
}) => {
  const [isLoading] = useAtom(isLoadingAtom);
  const [showHistory, setShowHistory] = useAtom(showHistoryAtom);
  const [, setInputValue] = useAtom(inputValueAtom);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const history = getSearchHistory();

  const handleClick = async (word: string) => {
    if (isLoading) return;
    try {
      setShowHistory(false); // Close the panel when a word is clicked
      await onWordClick(word);
      setInputValue("");
    } catch (error) {
      console.error("Error handling history word click:", error);
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

  const clearHistory = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(HISTORY_KEY);
    setShowHistory(false);
    toast.success("Search history cleared");
  };

  const groupHistoryByDate = (items: SearchHistoryItem[]) => {
    const groups: { [key: string]: SearchHistoryItem[] } = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Earlier: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    items.forEach((item) => {
      const date = new Date(item.timestamp);
      if (date >= today) {
        groups.Today.push(item);
      } else if (date >= yesterday) {
        groups.Yesterday.push(item);
      } else if (date >= thisWeek) {
        groups["This Week"].push(item);
      } else if (date >= thisMonth) {
        groups["This Month"].push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return groups;
  };

  const filteredHistory = history.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groupedHistory = groupHistoryByDate(filteredHistory);

  if (!showHistory || history.length === 0) return null;

  return (
    <div className="fixed right-4 left-4 md:left-auto md:w-96 top-20 dark:bg-gray-800/90 bg-white/90 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl p-4 md:p-6 transition-all duration-1000 shadow-2xl z-50 max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-serif">Recent Searches</h2>
          <button
            onClick={clearHistory}
            className="opacity-50 hover:opacity-100 transition-opacity"
            title="Clear history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
          <button
            onClick={clearAllCache}
            className="opacity-50 hover:opacity-100 transition-opacity"
            title="Clear all cached words"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m10 10-2 2 2 2" />
              <path d="m14 14 2-2-2-2" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setShowHistory(false)}
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="mb-4 sticky top-0">
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transform transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
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
  );
};

const InputNode = ({
  data,
}: {
  data: { onSubmit: (word: string) => Promise<void>; initialWord?: string };
}) => {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [showHistory, setShowHistory] = useAtom(showHistoryAtom);
  const history = getSearchHistory();

  const placeholder = useTypingAnimation(
    [
      "Enter a word",
      "Φιλοσοφία",
      "Generare",
      "Bibliotheca",
      "Democracy",
      "Metamorphosis",
      "Esperanza",
      "Mariposa",
      "Ἀλήθεια",
      "Felicitas",
      "Synchronicity",
      "Libertad",
    ],
    100,
    50,
    2000
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    await Promise.all([
      data.onSubmit(inputValue),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    addToSearchHistory(inputValue); // Add to history after successful lookup
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsLoading(false);
  };

  // Set initial value if provided
  useEffect(() => {
    if (data.initialWord) {
      setInputValue(data.initialWord);
    }
  }, [data.initialWord]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <a
          href="/"
          className="text-4xl font-serif dark:text-gray-100 text-gray-900 hover:opacity-80 transition-opacity"
          title="Go to home page"
        >
          Etymon.ai
        </a>
        <span className="px-2 py-0.5 text-xs font-medium dark:bg-blue-500/20 bg-blue-500/10 dark:text-blue-300 text-blue-600 rounded-full">
          beta
        </span>
      </div>
      <form
        className={`px-6 py-4 rounded-xl dark:bg-gray-800/80 bg-white/80 dark:border-gray-700/50 border-gray-200/50 border shadow-xl flex gap-3 ${
          isLoading ? "loading-border active" : "loading-border"
        }`}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg dark:bg-gray-900/50 bg-gray-50/50 dark:border-gray-700/50 border-gray-200/50 border dark:text-gray-100 text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          disabled={isLoading}
        />
        <div className="flex gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              disabled={isLoading}
              className="px-3 py-2 rounded-lg dark:bg-gray-700/50 bg-gray-100/50 hover:dark:bg-gray-600/50 hover:bg-gray-200/50 dark:text-gray-300 text-gray-700 transition-colors disabled:opacity-50"
              title="View search history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-[120px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {isLoading ? <Spinner variant="random" /> : "Etymologize"}
          </button>
        </div>
      </form>
    </div>
  );
};

const wordChunkPadding = 3;
const originPadding = 10;
const verticalSpacing = 50;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const newNodes: Node[] = [];
  console.log("layouting nodes", nodes);

  const inputNode = nodes.find((node) => node.type === "inputNode");
  const inputWidth = inputNode?.measured?.width ?? 0;
  const inputHeight = inputNode?.measured?.height ?? 0;
  let nextY = inputHeight + verticalSpacing;

  if (inputNode) {
    newNodes.push({
      ...inputNode,
      position: { x: -inputWidth / 2, y: 0 },
    });
  }

  let totalWordChunkWidth = 0;

  // First pass: measure word chunks
  nodes.forEach((node) => {
    if (node.type === "wordChunk") {
      totalWordChunkWidth += (node.measured?.width ?? 0) + wordChunkPadding;
    }
  });

  // Position word chunks
  let lastWordChunkX = 0;
  nodes.forEach((node) => {
    if (node.type === "wordChunk") {
      newNodes.push({
        ...node,
        position: {
          x: -totalWordChunkWidth / 2 + lastWordChunkX,
          y: nextY,
        },
      });
      lastWordChunkX += (node.measured?.width ?? 0) + wordChunkPadding;
    }
  });

  nextY +=
    verticalSpacing +
    (nodes.find((node) => node.type === "wordChunk")?.measured?.height ?? 0);

  // Position origins
  let totalOriginWidth = 0;
  nodes.forEach((node) => {
    if (node.type === "origin") {
      totalOriginWidth += (node.measured?.width ?? 0) + originPadding;
    }
  });

  let lastOriginX = 0;
  nodes.forEach((node) => {
    if (node.type === "origin") {
      newNodes.push({
        ...node,
        position: {
          x: -totalOriginWidth / 2 + lastOriginX,
          y: nextY,
        },
      });
      lastOriginX += (node.measured?.width ?? 0) + originPadding;
    }
  });

  nextY +=
    verticalSpacing +
    Math.max(
      ...nodes
        .filter((node) => node.type === "origin")
        .map((node) => node.measured?.height ?? 0)
    );

  // Position combinations by layer
  const combinationsByY = new Map<number, Node[]>();
  nodes.forEach((node) => {
    if (node.type === "combined") {
      const layer = node.position.y / verticalSpacing - 2; // Convert y back to layer number
      if (!combinationsByY.has(layer)) {
        combinationsByY.set(layer, []);
      }
      combinationsByY.get(layer)!.push(node);
    }
  });

  // Layout each layer of combinations
  const sortedLayers = Array.from(combinationsByY.keys()).sort((a, b) => a - b);
  sortedLayers.forEach((layer) => {
    const layerNodes = combinationsByY.get(layer)!;
    let totalWidth = 0;
    layerNodes.forEach((node) => {
      totalWidth += (node.measured?.width ?? 0) + originPadding;
    });

    let lastX = 0;
    layerNodes.forEach((node) => {
      newNodes.push({
        ...node,
        position: {
          x: -totalWidth / 2 + lastX,
          y: nextY,
        },
      });
      lastX += (node.measured?.width ?? 0) + originPadding;
    });
    nextY +=
      verticalSpacing +
      Math.max(...layerNodes.map((node) => node.measured?.height ?? 0));
  });

  return { nodes: newNodes, edges };
}

// interface Definition {
//   parts: {
//     id: string;
//     text: string;
//     originalWord: string;
//     origin: string;
//     meaning: string;
//   }[];
//   combinations: {
//     id: string;
//     text: string;
//     definition: string;
//     sourceIds: string[];
//   }[];
// }

type Definition = z.infer<typeof wordSchema>;

const defaultDefinition: Definition = {
  thought:
    "From Ancient Greek Φιλοσοφία (philosophia), combining φίλος (philos) 'loving' and σοφία (sophia) 'wisdom'. The concept emerged in ancient Greece as the 'love of wisdom' and systematic study of fundamental truths.",
  parts: [
    {
      id: "phil",
      text: "Φιλο",
      originalWord: "φίλος",
      origin: "Ancient Greek",
      meaning: "loving, fond of, attracted to",
    },
    {
      id: "sophia",
      text: "σοφία",
      originalWord: "σοφία",
      origin: "Ancient Greek",
      meaning: "wisdom, knowledge, expertise",
    },
  ],
  combinations: [
    [
      {
        id: "philosophia",
        text: "Φιλοσοφία",
        definition: "the love or pursuit of wisdom and knowledge",
        sourceIds: ["phil", "sophia"],
      },
    ],
  ],
  similarWords: [
    {
      word: "φιλολογία",
      explanation:
        "The study of language and literature, literally 'love of words'",
      sharedOrigin: "Greek φίλος (philos) 'loving'",
    },
    {
      word: "σοφία",
      explanation: "Wisdom personified, directly from Greek σοφία",
      sharedOrigin: "Greek σοφία (sophia) 'wisdom'",
    },
    {
      word: "φιλάνθρωπος",
      explanation: "Lover of humanity, using same phil- prefix",
      sharedOrigin: "Greek φίλος (philos) 'loving'",
    },
  ],
};

function normalizeWord(word: string): string {
  // More robust normalization:
  // 1. Convert to lowercase
  // 2. Remove all whitespace
  // 3. Remove all non-alphanumeric characters
  // 4. Trim any remaining whitespace
  return word
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, ""); // This regex removes all non-letter and non-number characters, supporting Unicode
}

// Enhanced function to detect word mismatch with more flexibility
function isWordMismatch(
  searchWord: string,
  responseWord: string,
  thought: string
): boolean {
  const normalizedSearch = normalizeWord(searchWord);
  const normalizedResponse = normalizeWord(responseWord);

  // Direct match - best case
  if (normalizedResponse === normalizedSearch) {
    return false;
  }

  // Check if one contains the other (for compound words or partial matches)
  if (
    normalizedResponse.includes(normalizedSearch) ||
    normalizedSearch.includes(normalizedResponse)
  ) {
    return false;
  }

  // For non-Latin words, check if the thought contains the search word
  const hasNonLatinChars = /[^\u0000-\u007F]/.test(responseWord);
  if (hasNonLatinChars && thought.toLowerCase().includes(normalizedSearch)) {
    return false;
  }

  // Check for accent differences (normalize Unicode)
  const normalizedSearchNFD = normalizedSearch.normalize("NFD");
  const normalizedResponseNFD = normalizedResponse.normalize("NFD");
  if (normalizedSearchNFD === normalizedResponseNFD) {
    return false;
  }

  // Check for common misspellings or slight variations
  // Calculate Levenshtein distance (simple version)
  const distance = levenshteinDistance(normalizedSearch, normalizedResponse);
  const maxLength = Math.max(
    normalizedSearch.length,
    normalizedResponse.length
  );
  // Allow up to 20% difference for longer words, or 1 character for short words
  const threshold = Math.max(1, Math.floor(maxLength * 0.2));

  if (distance <= threshold) {
    return false;
  }

  // If we get here, it's likely a mismatch
  return true;
}

// Helper function to calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Add this function after isWordMismatch
function validateApiResponse(
  data: any,
  searchWord: string
): { valid: boolean; error?: string } {
  try {
    // 1. Validate against schema
    const validatedData = wordSchema.parse(data);

    // 2. Check for required fields
    if (
      !validatedData.parts?.length ||
      !validatedData.combinations?.length ||
      !validatedData.similarWords?.length ||
      !validatedData.thought
    ) {
      return {
        valid: false,
        error: "Missing required fields or empty arrays in API response",
      };
    }

    // 3. Validate parts structure
    const validParts = validatedData.parts.every(
      (part) =>
        part.id && part.text && part.originalWord && part.origin && part.meaning
    );

    if (!validParts) {
      return {
        valid: false,
        error: "Invalid structure in parts field of API response",
      };
    }

    // 4. Validate combinations structure
    const validCombinations = validatedData.combinations.every(
      (layer) =>
        layer.length > 0 &&
        layer.every(
          (combo) =>
            combo.id &&
            combo.text &&
            combo.definition &&
            Array.isArray(combo.sourceIds) &&
            combo.sourceIds.length > 0
        )
    );

    if (!validCombinations) {
      return {
        valid: false,
        error: "Invalid structure in combinations field of API response",
      };
    }

    // 5. Validate similar words structure
    const validSimilarWords = validatedData.similarWords.every(
      (word) => word.word && word.explanation && word.sharedOrigin
    );

    if (!validSimilarWords) {
      return {
        valid: false,
        error: "Invalid structure in similarWords field of API response",
      };
    }

    // 6. Check if the final word in combinations matches the search word
    const lastLayer =
      validatedData.combinations[validatedData.combinations.length - 1];
    if (lastLayer && lastLayer.length > 0) {
      const finalWord = lastLayer[0].text;

      // Detect if we're dealing with non-Latin characters
      const hasNonLatinChars =
        /[^\u0000-\u007F]/.test(searchWord) ||
        /[^\u0000-\u007F]/.test(finalWord);

      // Skip strict validation for non-Latin words
      if (hasNonLatinChars) {
        console.log(
          "Word contains non-Latin characters, skipping strict validation"
        );
      } else {
        // Use the mismatch detection function only for Latin-based words
        if (isWordMismatch(searchWord, finalWord, validatedData.thought)) {
          return {
            valid: false,
            error: `API returned data for a different word: "${finalWord}" instead of "${searchWord}"`,
          };
        }
      }
    }

    // 7. Check if the thought field mentions the search word - make this a warning, not an error
    const normalizedSearchWord = normalizeWord(searchWord);
    if (
      !validatedData.thought.toLowerCase().includes(normalizedSearchWord) &&
      !validatedData.thought
        .toLowerCase()
        .normalize("NFD")
        .includes(normalizedSearchWord.normalize("NFD"))
    ) {
      // This is just a warning, not an error
      console.warn(
        `Warning: Thought field doesn't explicitly mention search word "${searchWord}"`
      );
    }

    // All validations passed
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

// Update the fetchWithRetry function to use the new validation function
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  word: string
): Promise<{ response: Response; data: any }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add a small delay before retries (not on first attempt)
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        console.log(`Retry attempt ${attempt} for word: ${word}`);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      // Check for API error responses
      if (!response.ok && response.status !== 203) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      // Use the comprehensive validation function
      const validation = validateApiResponse(data, word);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid API response");
      }

      // If we get here, the data is valid
      return { response, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry for certain errors
      if (
        lastError.message.includes("timeout") ||
        lastError.message.includes("credits") ||
        lastError.message.includes("API returned data for a different word")
      ) {
        throw lastError;
      }

      // If we've reached max retries, throw the last error
      if (attempt === maxRetries) {
        throw lastError;
      }

      console.warn(
        `Attempt ${attempt + 1} failed for word: ${word}. Error: ${
          lastError.message
        }`
      );
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError || new Error("Unknown error occurred during API call");
}

function getCachedWord(word: string): Definition | null {
  if (typeof window === "undefined") return null;

  try {
    const normalizedSearchWord = normalizeWord(word);
    const cacheKey = CACHE_PREFIX + normalizedSearchWord;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      console.log("No cache found for:", word);
      return null;
    }

    let parsedCache;
    try {
      parsedCache = JSON.parse(cached);
    } catch (error) {
      console.error("Failed to parse cached data:", error);
      localStorage.removeItem(cacheKey);
      return null;
    }

    const { data, timestamp, originalWord } = parsedCache;

    // Check if cache has expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      console.log("Cache expired for:", word);
      localStorage.removeItem(cacheKey);
      return null;
    }

    // More flexible check for word matching
    const normalizedOriginal = normalizeWord(originalWord);
    if (normalizedOriginal !== normalizedSearchWord) {
      // Try more flexible matching for non-Latin characters
      const hasNonLatinChars =
        /[^\u0000-\u007F]/.test(originalWord) || /[^\u0000-\u007F]/.test(word);

      if (hasNonLatinChars) {
        console.log(
          "Non-Latin characters detected, using flexible matching for:",
          word
        );
        // For non-Latin words, we'll be more lenient
        // Check normalized forms (NFD)
        const normalizedOriginalNFD = normalizedOriginal.normalize("NFD");
        const normalizedSearchNFD = normalizedSearchWord.normalize("NFD");

        if (normalizedOriginalNFD !== normalizedSearchNFD) {
          // Check Levenshtein distance for similar words
          const distance = levenshteinDistance(
            normalizedOriginal,
            normalizedSearchWord
          );
          const maxLength = Math.max(
            normalizedOriginal.length,
            normalizedSearchWord.length
          );
          const threshold = Math.max(1, Math.floor(maxLength * 0.2));

          if (distance > threshold) {
            console.log(
              "Cache mismatch for:",
              word,
              "vs",
              originalWord,
              "distance:",
              distance
            );
            localStorage.removeItem(cacheKey);
            return null;
          }
        }
      } else {
        console.log("Cache mismatch for:", word, "vs", originalWord);
        localStorage.removeItem(cacheKey);
        return null;
      }
    }

    // Validate the cached data against the schema
    try {
      const validatedData = wordSchema.parse(data);

      // Additional validation for required fields and their structure
      if (
        !validatedData.parts?.length ||
        !validatedData.combinations?.length ||
        !validatedData.similarWords?.length ||
        !validatedData.thought
      ) {
        console.error("Missing required fields or empty arrays in cached data");
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Validate parts structure
      const validParts = validatedData.parts.every(
        (part) =>
          part.id &&
          part.text &&
          part.originalWord &&
          part.origin &&
          part.meaning
      );

      // Validate combinations structure
      const validCombinations = validatedData.combinations.every(
        (layer) =>
          layer.length > 0 &&
          layer.every(
            (combo) =>
              combo.id &&
              combo.text &&
              combo.definition &&
              Array.isArray(combo.sourceIds) &&
              combo.sourceIds.length > 0
          )
      );

      // Validate similar words structure
      const validSimilarWords = validatedData.similarWords.every(
        (word) => word.word && word.explanation && word.sharedOrigin
      );

      if (!validParts || !validCombinations || !validSimilarWords) {
        console.error("Invalid structure in cached data fields");
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Additional validation: Check if the final word in combinations matches the search word
      const lastLayer =
        validatedData.combinations[validatedData.combinations.length - 1];
      if (lastLayer && lastLayer.length > 0) {
        const finalWord = lastLayer[0].text;

        // Detect if we're dealing with non-Latin characters
        const hasNonLatinChars =
          /[^\u0000-\u007F]/.test(word) || /[^\u0000-\u007F]/.test(finalWord);

        // Skip strict validation for non-Latin words
        if (hasNonLatinChars) {
          console.log(
            "Word contains non-Latin characters, using flexible validation for cached data"
          );
        } else {
          // Use the new mismatch detection function for Latin-based words
          if (isWordMismatch(word, finalWord, validatedData.thought)) {
            console.error(
              `Final word in cached data (${finalWord}) doesn't match search word (${word})`
            );
            localStorage.removeItem(cacheKey);
            return null;
          }
        }
      }

      console.log("Successfully validated cached data for:", word);
      return validatedData;
    } catch (error) {
      console.error("Invalid cached data schema:", error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (error) {
    console.error("Error reading cache:", error);
    // Clear all potentially corrupted cache entries
    clearCorruptedCache();
    return null;
  }
}

function cacheWord(word: string, data: Definition) {
  if (typeof window === "undefined") return;

  try {
    const normalizedWord = normalizeWord(word);
    const cacheKey = CACHE_PREFIX + normalizedWord;

    // Clear existing cache for this word
    localStorage.removeItem(cacheKey);

    // Validate data before caching
    try {
      const validatedData = wordSchema.parse(data);
      // Additional validation for required fields
      if (
        !validatedData.parts ||
        !validatedData.combinations ||
        !validatedData.similarWords
      ) {
        throw new Error("Missing required fields in data to be cached");
      }

      // Additional validation: Check if the final word in combinations matches the search word
      const lastLayer =
        validatedData.combinations[validatedData.combinations.length - 1];
      if (lastLayer && lastLayer.length > 0) {
        const finalWord = lastLayer[0].text;

        // Detect if we're dealing with non-Latin characters
        const hasNonLatinChars =
          /[^\u0000-\u007F]/.test(word) || /[^\u0000-\u007F]/.test(finalWord);

        // Skip strict validation for non-Latin words
        if (hasNonLatinChars) {
          console.log(
            "Word contains non-Latin characters, using flexible validation for caching"
          );
        } else {
          // Use the mismatch detection function for Latin-based words
          if (isWordMismatch(word, finalWord, validatedData.thought)) {
            throw new Error(
              `Final word in combinations (${finalWord}) doesn't match search word (${word})`
            );
          }
        }
      }

      const cacheData = {
        data: validatedData,
        timestamp: Date.now(),
        originalWord: word,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log("Successfully cached word:", word);
    } catch (error) {
      console.error("Invalid data for caching:", error);
      return;
    }
  } catch (error) {
    console.error("Error caching word:", error);
    // If storage fails, try to clear old cache entries
    try {
      clearOldCache();
    } catch (e) {
      console.error("Error clearing old cache:", e);
    }
  }
}

function clearCorruptedCache() {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { data } = JSON.parse(cached);
            // Try to validate the data
            wordSchema.parse(data);
          }
        } catch (e) {
          // If we can't parse or validate, mark for removal
          keysToRemove.push(key);
        }
      }
    }

    // Remove corrupted entries
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
        console.log("Removed corrupted cache entry:", key);
      } catch (e) {
        console.error("Error removing corrupted cache key:", key, e);
      }
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleared ${keysToRemove.length} corrupted cache entries`);
    }
  } catch (error) {
    console.error("Error in clearCorruptedCache:", error);
  }
}

function clearOldCache() {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now();
    const keysToRemove = [];

    // Find all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > CACHE_EXPIRY) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // If we can't parse this item, mark it for removal
          keysToRemove.push(key);
        }
      }
    }

    // Remove expired or corrupted keys
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
        console.log("Removed expired/corrupted cache entry:", key);
      } catch (e) {
        console.error("Error removing cache key:", key, e);
      }
    });

    if (keysToRemove.length > 0) {
      console.log(
        `Cleared ${keysToRemove.length} expired/corrupted cache entries`
      );
    }
  } catch (error) {
    console.error("Error in clearOldCache:", error);
  }
}

function createInitialNodes(
  definition: Definition,
  handleWordSubmit: (word: string) => Promise<void>,
  initialWord?: string
) {
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  initialNodes.push({
    id: "input1",
    type: "inputNode",
    position: { x: 0, y: 0 },
    data: { onSubmit: handleWordSubmit, initialWord },
  });

  // Add word parts and their origins
  definition.parts.forEach((part, index) => {
    // Word chunk node
    initialNodes.push({
      id: part.id,
      type: "wordChunk",
      position: { x: 0, y: 0 },
      data: {
        text: part.text,
        isLastChunk: index === definition.parts.length - 1, // Mark the last chunk
      },
    });

    // Origin node - position relative to word chunk width
    const originId = `origin-${part.id}`;
    initialNodes.push({
      id: originId,
      type: "origin",
      position: { x: 0, y: 0 },
      data: {
        originalWord: part.originalWord,
        origin: part.origin,
        meaning: part.meaning,
      },
    });

    // Connect word part to origin
    initialEdges.push({
      id: `edge-${part.id}-${originId}`,
      source: part.id,
      target: originId,
      type: "straight",
      style: { stroke: "#4B5563", strokeWidth: 1 },
      animated: true,
    });
  });

  // Add combinations layer by layer
  definition.combinations.forEach((layer, layerIndex) => {
    const y = (layerIndex + 2) * verticalSpacing;

    layer.forEach((combination) => {
      const sourceOrigins = combination.sourceIds
        .map((id) => {
          const part = definition.parts.find((p) => p.id === id);
          if (part) return part.origin;
          const prevCombo = definition.combinations
            .flat()
            .find((c) => c.id === id);
          return prevCombo?.origin;
        })
        .filter(Boolean);

      const mainOrigin = sourceOrigins[0] || "";

      // Add combination node
      initialNodes.push({
        id: combination.id,
        type: "combined",
        position: { x: 0, y },
        data: {
          text: combination.text,
          definition: combination.definition,
          origin: mainOrigin,
        },
      });

      // Add edges from all sources
      combination.sourceIds.forEach((sourceId) => {
        // If source is a word part, connect from its origin node
        const isPart = definition.parts.find((p) => p.id === sourceId);
        const actualSourceId = isPart ? `origin-${sourceId}` : sourceId;

        initialEdges.push({
          id: `edge-${actualSourceId}-${combination.id}`,
          source: actualSourceId,
          target: combination.id,
          type: "straight",
          style: { stroke: "#4B5563", strokeWidth: 1 },
          animated: true,
        });
      });
    });
  });

  return { initialNodes, initialEdges };
}

const nodeTypes = {
  wordChunk: WordChunkNode,
  origin: OriginNode,
  combined: CombinedNode,
  inputNode: InputNode,
};

const SimilarWordsPanel = ({
  similarWords,
  onWordClick,
}: {
  similarWords: Definition["similarWords"];
  onWordClick: (word: string) => Promise<void>;
}) => {
  const [isLoading] = useAtom(isLoadingAtom);
  const [showSimilar, setShowSimilar] = useAtom(showSimilarAtom);
  const [, setInputValue] = useAtom(inputValueAtom);

  const handleClick = async (word: string) => {
    console.log("Similar word clicked:", word);
    if (isLoading) {
      console.log("Loading in progress, click ignored");
      return;
    }
    try {
      setShowSimilar(false); // Hide the panel when clicking a word
      await onWordClick(word);
      addToSearchHistory(word); // Add the similar word to history
      setInputValue(""); // Clear the input value using the atom
    } catch (error) {
      console.error("Error handling similar word click:", error);
      toast.error("Failed to look up similar word. Please try again.");
    }
  };

  if (!showSimilar) return null;

  return (
    <div
      className={`fixed right-4 top-20 w-96 dark:bg-gray-800/90 bg-white/90 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl p-6 transition-all duration-1000 shadow-2xl z-50 ${
        isLoading ? "opacity-0 blur-[20px]" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-serif">Similar Words</h2>
        <button
          onClick={() => setShowSimilar(false)}
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="space-y-4">
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
    </div>
  );
};

const CreditsCounter = () => {
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

  useEffect(() => {
    setCreditsUsed(getCreditsUsed());

    const updateCredits = () => {
      setCreditsUsed(getCreditsUsed());
    };

    window.addEventListener("storage", updateCredits);
    window.addEventListener("credits_updated", updateCredits);

    return () => {
      window.removeEventListener("storage", updateCredits);
      window.removeEventListener("credits_updated", updateCredits);
    };
  }, []);

  if (creditsUsed === null) return null;

  return (
    <div className="fixed bottom-4 right-4 px-3 py-1.5 rounded-lg dark:bg-gray-800/90 bg-white/90 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border shadow-lg z-50">
      <p className="text-sm font-medium">
        Credits:{" "}
        <span className="text-blue-500">{MAX_CREDITS - creditsUsed}</span> /{" "}
        {MAX_CREDITS}
      </p>
    </div>
  );
};

function resetApplicationState(
  message = "Application state has been reset due to persistent issues."
) {
  if (typeof window === "undefined") return;

  try {
    // Clear all cache
    clearAllCache();

    // Clear search history if needed
    // localStorage.removeItem(HISTORY_KEY);

    // Reset credits if needed
    // localStorage.setItem(CREDITS_KEY, "0");

    // Show message to user
    toast.info(message, {
      duration: 5000,
      description:
        "All cached data has been cleared. Please try your search again.",
    });

    console.log("Application state reset successfully");
  } catch (error) {
    console.error("Error resetting application state:", error);
    toast.error("Failed to reset application state. Please refresh the page.");
  }
}

function Deconstructor({ word }: { word?: string }) {
  const [, setIsLoading] = useAtom(isLoadingAtom);
  const [definition, setDefinition] = useState<Definition>(defaultDefinition);
  const plausible = usePlausible();
  const [, setShowSimilar] = useAtom(showSimilarAtom);
  const [, setInputValue] = useAtom(inputValueAtom);
  const [urlLoadAttempted, setUrlLoadAttempted] = useState(false);

  // Add a function to handle browser navigation events
  function setupBrowserNavigation() {
    if (typeof window === "undefined") return;

    // Define the handler function
    const handlePopState = (event: PopStateEvent) => {
      console.log("Navigation event detected", window.location.pathname);

      // Check if we're on a word page
      const match = window.location.pathname.match(/\/word\/([^/]+)/);
      if (match) {
        const word = decodeURIComponent(match[1]);
        console.log("Detected navigation to word:", word);

        // We don't call handleWordSubmit directly here because
        // the component will handle it via its useEffect
        setUrlLoadAttempted(false); // Reset to allow loading the word
      }
    };

    // Add the event listener
    window.addEventListener("popstate", handlePopState);

    // Return a cleanup function
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }

  // Call this function when the component mounts
  useEffect(() => {
    const cleanup = setupBrowserNavigation();
    return cleanup;
  }, []);

  const handleWordSubmit = async (word: string) => {
    if (!word.trim()) return;

    // Reset states at the start of a new search
    setShowSimilar(false);
    setIsLoading(true);
    setInputValue(word);

    const normalizedWord = normalizeWord(word);

    // Update URL for better SEO and sharing
    if (typeof window !== "undefined") {
      const url = `/word/${encodeURIComponent(normalizedWord)}`;
      window.history.pushState({ word: normalizedWord }, "", url);
    }

    const cacheKey = CACHE_PREFIX + normalizedWord;

    // Check cache first
    const cached = getCachedWord(word);
    if (cached) {
      console.log("Using cached data for:", word);
      try {
        // Double-check the cached data is valid
        wordSchema.parse(cached);
        if (!cached.parts || !cached.combinations || !cached.similarWords) {
          throw new Error("Missing required fields in cached data");
        }

        // Additional validation: Check if the final word in combinations matches the search word
        const lastLayer = cached.combinations[cached.combinations.length - 1];
        if (lastLayer && lastLayer.length > 0) {
          const finalWord = lastLayer[0].text;

          // Detect if we're dealing with non-Latin characters
          const hasNonLatinChars =
            /[^\u0000-\u007F]/.test(word) || /[^\u0000-\u007F]/.test(finalWord);

          // Skip strict validation for non-Latin words
          if (hasNonLatinChars) {
            console.log(
              "Word contains non-Latin characters, using flexible validation for cached data"
            );
          } else {
            // Use the new mismatch detection function for Latin-based words
            if (isWordMismatch(word, finalWord, cached.thought)) {
              throw new Error(
                `Final word in cached data (${finalWord}) doesn't match search word (${word})`
              );
            }
          }
        }

        setDefinition(cached);
        addToSearchHistory(word, cached); // Add to history with cached data
        toast.success("Retrieved from cache", { duration: 2000 });
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Invalid cached data:", error);
        localStorage.removeItem(cacheKey);
        // Continue with API call since cache was invalid
      }
    }

    const creditsUsed = getCreditsUsed();
    if (creditsUsed >= MAX_CREDITS) {
      const timestamp = parseInt(
        localStorage.getItem(CREDITS_TIMESTAMP_KEY) || "0",
        10
      );
      const timeLeft = CREDITS_INTERVAL - (Date.now() - timestamp);
      const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

      toast.error(
        "You've used all your credits. Please wait for the next refresh.",
        {
          duration: 8000,
          description: `You get ${MAX_CREDITS} credits every 6 hours. Next refresh in ~${hoursLeft} hours.`,
        }
      );
      setIsLoading(false);
      return;
    }

    try {
      // Use the new fetchWithRetry function
      const { response, data: validatedData } = await fetchWithRetry(
        "/api",
        {
          method: "POST",
          body: JSON.stringify({ word }),
          headers: {
            "Content-Type": "application/json",
          },
        },
        2, // Max retries
        word
      );

      if (response.status === 203) {
        // We'll silently accept partial results without showing a warning to the user
      }

      // Only cache and update state if we have valid data
      setDefinition(validatedData);
      incrementCreditsUsed();

      // Use a safer way to dispatch the event
      try {
        const event = new Event("credits_updated");
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Error dispatching credits_updated event:", error);
      }

      // Cache the word and add to history with complete data
      cacheWord(word, validatedData);
      addToSearchHistory(word, validatedData); // Add to history with complete data

      plausible("deconstruct", {
        props: {
          word,
        },
      });
    } catch (error) {
      plausible("deconstruct_error", {
        props: {
          word,
        },
      });

      // Reset the definition to default on error
      setDefinition(defaultDefinition);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to process this word. Try another one.";

      // Handle specific error types
      if (error instanceof Error) {
        // Check if this is a non-Latin word with validation issues
        const hasNonLatinChars = /[^\u0000-\u007F]/.test(word);
        const isValidationError = error.message.includes(
          "API returned data for a different word"
        );

        if (isValidationError && hasNonLatinChars) {
          // For non-Latin words with validation errors, we'll be more lenient
          console.warn(
            "Non-Latin word validation issue, attempting to proceed anyway:",
            error.message
          );

          // Try to extract the data from the error if possible
          try {
            // This is a bit of a hack, but we're trying to recover from validation errors
            // for non-Latin words where our validation might be too strict
            const match = error.message.match(
              /API returned data for a different word: "([^"]+)"/
            );
            if (match && match[1]) {
              const alternativeWord = match[1];
              toast.info(
                `Showing results for "${alternativeWord}" which appears to be related to your search.`,
                { duration: 5000 }
              );

              // We could try to recover the data here if we had access to it
              // For now, we'll just let the error handling continue
            }
          } catch (extractError) {
            console.error(
              "Error trying to extract alternative word:",
              extractError
            );
          }
        } else if (
          error.message.includes("API returned data for a different word")
        ) {
          // This is a word mismatch error - reset application state
          resetApplicationState(
            "API returned incorrect data. Application state has been reset."
          );
        } else if (error.message.includes("timeout")) {
          toast.error(
            "This word is taking too long to process. Try a simpler word.",
            {
              duration: 5000,
            }
          );
        } else {
          // Generic error message
          toast.error(message, {
            duration: 5000,
          });
        }
      } else {
        // Generic error message
        toast.error(message, {
          duration: 5000,
        });
      }

      // Clear any potentially corrupted cache for this word
      localStorage.removeItem(cacheKey);

      // If the error message indicates a serious issue, reset application state
      if (
        error instanceof Error &&
        (error.message.includes("API returned data for a different word") ||
          error.message.includes("not related to")) &&
        !/[^\u0000-\u007F]/.test(word) // Only reset for Latin-based words
      ) {
        resetApplicationState(
          "Encountered persistent issues with word lookup. Application state has been reset."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Separate effect for URL-based word loading
  useEffect(() => {
    if (word && !urlLoadAttempted) {
      setUrlLoadAttempted(true);
      handleWordSubmit(word).catch((error) => {
        console.error("Error loading word from URL:", error);
        setIsLoading(false);
        toast.error(
          "Failed to load word from URL. Please try searching again.",
          {
            duration: 5000,
          }
        );
      });
    }
  }, [word, urlLoadAttempted]);

  // Reset URL load attempted when word changes
  useEffect(() => {
    if (word) {
      setUrlLoadAttempted(false);
    }
  }, [word]);

  const { initialNodes, initialEdges } = useMemo(
    () => createInitialNodes(definition, handleWordSubmit, word),
    [definition, word]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: false });

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    console.log("nodesInitialized", nodesInitialized);
    if (nodesInitialized) {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [nodesInitialized]);

  useEffect(() => {
    console.log("detected nodes change", nodes);
    fitView({
      duration: 1000,
    });
  }, [nodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="currentColor" className="opacity-5" />
        {definition.similarWords && (
          <SimilarWordsPanel
            similarWords={definition.similarWords}
            onWordClick={handleWordSubmit}
          />
        )}
        <HistoryPanel onWordClick={handleWordSubmit} />
      </ReactFlow>
    </div>
  );
}

export default function WordDeconstructor({ word }: { word?: string }) {
  const [isLoading] = useAtom(isLoadingAtom);

  return (
    <div
      className="h-screen dark:bg-gray-900 bg-white dark:text-gray-100 text-gray-900"
      style={
        { "--loading-state": isLoading ? "1" : "0" } as React.CSSProperties
      }
    >
      <ReactFlowProvider>
        <Deconstructor word={word} />
      </ReactFlowProvider>
      <CreditsCounter />
    </div>
  );
}
