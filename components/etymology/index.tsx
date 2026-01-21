"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAtom } from "jotai";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import type { Definition } from "@/utils/schema";
import { wordSchema } from "@/utils/schema";

// Atoms
import {
  isLoadingAtom,
  showSimilarAtom,
  inputValueAtom,
  currentRootAtom,
  showWordFamilyAtom,
} from "./utils/atoms";

// Utils
import { CACHE_PREFIX, CREDITS_INTERVAL, MAX_CREDITS } from "./utils/constants";
import { normalizeWord, isWordMismatch, hasNonLatinChars } from "./utils/helpers";
import { getCachedWord, cacheWord, clearAllCache } from "./utils/cache";
import {
  getCreditsUsed,
  incrementCreditsUsed,
  getCreditsTimestamp,
} from "./utils/credits";
import { addToSearchHistory } from "./utils/history";
import { fetchWithRetry } from "./utils/validation";
import { getLayoutedElements, createInitialNodes } from "./utils/layout";

// Components
import WordChunkNode from "./nodes/WordChunkNode";
import OriginNode from "./nodes/OriginNode";
import CombinedNode from "./nodes/CombinedNode";
import InputNode from "./nodes/InputNode";
import SimilarWordsPanel from "./panels/SimilarWordsPanel";
import HistoryPanel from "./panels/HistoryPanel";
import CreditsCounter from "./panels/CreditsCounter";
import WordFamilyPanel from "./panels/WordFamilyPanel";
import TimelinePanel from "./panels/TimelinePanel";
import CognatesPanel from "./panels/CognatesPanel";
import WordOfTheDayPanel from "./panels/WordOfTheDayPanel";
import FloatingMenu from "./panels/FloatingMenu";

const nodeTypes = {
  wordChunk: WordChunkNode,
  origin: OriginNode,
  combined: CombinedNode,
  inputNode: InputNode,
};

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

function resetApplicationState(
  message = "Application state has been reset due to persistent issues."
) {
  if (typeof window === "undefined") return;

  try {
    clearAllCache();
    toast.info(message, {
      duration: 5000,
      description:
        "All cached data has been cleared. Please try your search again.",
    });
  } catch {
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
  const [, setCurrentRoot] = useAtom(currentRootAtom);
  const [, setShowWordFamily] = useAtom(showWordFamilyAtom);

  const handleExploreRoot = (root: string) => {
    setCurrentRoot(root);
    setShowWordFamily(true);
    // This will be implemented with the Word Family feature
    console.log("Exploring root:", root);
  };

  // Browser navigation handler
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const match = window.location.pathname.match(/\/word\/([^/]+)/);
      if (match) {
        setUrlLoadAttempted(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleWordSubmit = async (wordInput: string) => {
    if (!wordInput.trim()) return;

    setShowSimilar(false);
    setIsLoading(true);
    setInputValue(wordInput);

    const normalizedWord = normalizeWord(wordInput);

    // Update URL
    if (typeof window !== "undefined") {
      const url = `/word/${encodeURIComponent(normalizedWord)}`;
      window.history.pushState({ word: normalizedWord }, "", url);
    }

    const cacheKey = CACHE_PREFIX + normalizedWord;

    // Check cache
    const cached = getCachedWord(wordInput);
    if (cached) {
      try {
        wordSchema.parse(cached);
        if (!cached.parts || !cached.combinations || !cached.similarWords) {
          throw new Error("Missing required fields");
        }

        const lastLayer = cached.combinations[cached.combinations.length - 1];
        if (lastLayer && lastLayer.length > 0) {
          const finalWord = lastLayer[0].text;
          if (
            !hasNonLatinChars(wordInput) &&
            !hasNonLatinChars(finalWord)
          ) {
            if (isWordMismatch(wordInput, finalWord, cached.thought)) {
              throw new Error("Word mismatch in cache");
            }
          }
        }

        setDefinition(cached);
        addToSearchHistory(wordInput, cached);
        toast.success("Retrieved from cache", { duration: 2000 });
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    // Check credits
    const creditsUsed = getCreditsUsed();
    if (creditsUsed >= MAX_CREDITS) {
      const timestamp = getCreditsTimestamp();
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
      const { response, data: validatedData } = await fetchWithRetry(
        "/api",
        {
          method: "POST",
          body: JSON.stringify({ word: wordInput }),
          headers: { "Content-Type": "application/json" },
        },
        2,
        wordInput
      );

      setDefinition(validatedData as Definition);
      incrementCreditsUsed();

      cacheWord(wordInput, validatedData as Definition);
      addToSearchHistory(wordInput, validatedData as Definition);

      plausible("deconstruct", { props: { word: wordInput } });
    } catch (error) {
      plausible("deconstruct_error", { props: { word: wordInput } });
      setDefinition(defaultDefinition);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to process this word. Try another one.";

      if (error instanceof Error) {
        const hasNonLatin = hasNonLatinChars(wordInput);
        const isValidationError = error.message.includes(
          "API returned data for a different word"
        );

        if (isValidationError && hasNonLatin) {
          console.warn("Non-Latin word validation issue:", error.message);
        } else if (
          error.message.includes("API returned data for a different word")
        ) {
          resetApplicationState(
            "API returned incorrect data. Application state has been reset."
          );
        } else if (error.message.includes("timeout")) {
          toast.error(
            "This word is taking too long to process. Try a simpler word.",
            { duration: 5000 }
          );
        } else {
          toast.error(message, { duration: 5000 });
        }
      } else {
        toast.error(message, { duration: 5000 });
      }

      localStorage.removeItem(cacheKey);

      if (
        error instanceof Error &&
        (error.message.includes("API returned data for a different word") ||
          error.message.includes("not related to")) &&
        !hasNonLatinChars(wordInput)
      ) {
        resetApplicationState(
          "Encountered persistent issues with word lookup. Application state has been reset."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // URL-based word loading
  useEffect(() => {
    if (word && !urlLoadAttempted) {
      setUrlLoadAttempted(true);
      handleWordSubmit(word).catch((error) => {
        console.error("Error loading word from URL:", error);
        setIsLoading(false);
        toast.error(
          "Failed to load word from URL. Please try searching again.",
          { duration: 5000 }
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
    () => createInitialNodes(definition, handleWordSubmit, word, handleExploreRoot),
    [definition, word]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: false });

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (nodesInitialized) {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [nodesInitialized]);

  useEffect(() => {
    fitView({ duration: 1000 });
  }, [nodes, fitView]);

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
        <WordFamilyPanel onWordClick={handleWordSubmit} />
        <TimelinePanel />
        <CognatesPanel />
        <WordOfTheDayPanel onWordClick={handleWordSubmit} />
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
      <FloatingMenu />
      <CreditsCounter />
    </div>
  );
}
