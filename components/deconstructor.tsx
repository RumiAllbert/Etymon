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
const CACHE_PREFIX = "etymon_cache_";
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds
const HISTORY_KEY = "etymon_search_history";
const MAX_HISTORY_ITEMS = 10;

type SearchHistoryItem = {
  word: string;
  timestamp: number;
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

function addToSearchHistory(word: string) {
  if (typeof window === "undefined") return;
  try {
    const history = getSearchHistory();
    const normalizedWord = normalizeWord(word);

    // Remove existing entry of the same word if it exists
    const filteredHistory = history.filter(
      (item) => normalizeWord(item.word) !== normalizedWord
    );

    // Add new entry at the beginning
    const newHistory = [
      { word, timestamp: Date.now() },
      ...filteredHistory,
    ].slice(0, MAX_HISTORY_ITEMS); // Keep only the latest 10 items

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
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
  if (typeof window === "undefined") return;
  const current = getCreditsUsed();
  localStorage.setItem(CREDITS_KEY, (current + 1).toString());
  localStorage.setItem(CREDITS_TIMESTAMP_KEY, Date.now().toString());
}

type Combination = {
  id: string;
  text: string;
  definition: string;
  sourceIds: string[];
};

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
  const history = getSearchHistory();

  const handleClick = async (word: string) => {
    if (isLoading) return;
    try {
      setShowHistory(false);
      await onWordClick(word);
      setInputValue("");
    } catch (error) {
      console.error("Error handling history word click:", error);
      toast.error("Failed to look up word from history. Please try again.");
    }
  };

  if (!showHistory || history.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 w-96 dark:bg-gray-800/90 bg-white/90 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl p-6 transition-all duration-1000 shadow-2xl z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-serif">Recent Searches</h2>
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
      <div className="space-y-2">
        {history.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => handleClick(item.word)}
              disabled={isLoading}
              className="text-lg font-serif dark:text-blue-400 text-blue-600 hover:dark:text-blue-300 hover:text-blue-500 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.word}
            </button>
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>
        ))}
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
        <h1 className="text-4xl font-serif dark:text-gray-100 text-gray-900">
          Etymon.ai
        </h1>
        <span className="px-2 py-0.5 text-xs font-medium dark:bg-blue-500/20 bg-blue-500/10 dark:text-blue-300 text-blue-600 rounded-full">
          beta
        </span>
      </div>
      <form
        className="px-6 py-4 rounded-xl dark:bg-gray-800/80 bg-white/80 dark:border-gray-700/50 border-gray-200/50 border shadow-xl flex gap-3"
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
            {isLoading ? <Spinner /> : "Etymologize"}
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
  return word.toLowerCase().trim().replace(/\s+/g, "");
}

function getCachedWord(word: string): Definition | null {
  if (typeof window === "undefined") return null;

  const normalizedWord = normalizeWord(word);
  const cacheKey = CACHE_PREFIX + normalizedWord;
  const cached = localStorage.getItem(cacheKey);

  if (!cached) return null;

  try {
    const { data, timestamp, originalWord } = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Verify the cached data matches the requested word
    if (normalizeWord(originalWord) !== normalizedWord) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error parsing cached data:", error);
    localStorage.removeItem(cacheKey);
    return null;
  }
}

function cacheWord(word: string, data: Definition) {
  if (typeof window === "undefined") return;

  const normalizedWord = normalizeWord(word);
  const cacheKey = CACHE_PREFIX + normalizedWord;
  const cacheData = {
    data,
    timestamp: Date.now(),
    originalWord: word, // Store the original word for validation
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching word data:", error);
    // If storage fails, try to clear old cache entries
    try {
      clearOldCache();
    } catch (e) {
      console.error("Error clearing old cache:", e);
    }
  }
}

function clearOldCache() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (now - timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error("Error checking cache entry:", error);
        localStorage.removeItem(key);
      }
    }
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

function Deconstructor({ word }: { word?: string }) {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [definition, setDefinition] = useState<Definition>(defaultDefinition);
  const plausible = usePlausible();

  const handleWordSubmit = async (word: string) => {
    console.log("handleWordSubmit", word);
    if (!word.trim()) {
      toast.error("Please enter a word");
      return;
    }

    // Check cache first
    const cached = getCachedWord(word);
    if (cached) {
      console.log("Using cached data for:", word);
      setDefinition(cached);
      toast.success("Retrieved from cache", { duration: 2000 });
      return;
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
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetch("/api", {
        method: "POST",
        body: JSON.stringify({ word }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseData = await data.json();

      if (data.status === 203) {
        toast.info(
          "I had some trouble with that word, but here's my best attempt at breaking it down.",
          {
            duration: 5000,
          }
        );
        setDefinition(responseData);
        incrementCreditsUsed();
        window.dispatchEvent(new Event("credits_updated"));
        cacheWord(word, responseData); // Cache the response
      } else if (!data.ok) {
        throw new Error(responseData.error || "Failed to process word");
      } else {
        setDefinition(responseData);
        incrementCreditsUsed();
        window.dispatchEvent(new Event("credits_updated"));
        cacheWord(word, responseData); // Cache the response
      }

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

      const message =
        error instanceof Error
          ? error.message
          : "Unable to process this word. Try another one.";
      toast.error(message, {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (word) {
      handleWordSubmit(word);
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
