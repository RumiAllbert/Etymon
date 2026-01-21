"use client";

import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { Globe, Volume2 } from "lucide-react";
import { showCognatesPanelAtom, cognatesWordAtom } from "../utils/atoms";
import type { CognatesResponse } from "@/utils/schema";
import Spinner from "@/components/spinner";
import DraggablePanel from "./DraggablePanel";

interface CognatesPanelProps {
  word?: string;
}

async function fetchCognates(word: string): Promise<CognatesResponse> {
  const response = await fetch("/api/cognates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cognates");
  }

  return response.json();
}

// Language to flag emoji mapping
const languageFlags: Record<string, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
  nl: "🇳🇱",
  sv: "🇸🇪",
  no: "🇳🇴",
  fr: "🇫🇷",
  es: "🇪🇸",
  it: "🇮🇹",
  pt: "🇵🇹",
  ro: "🇷🇴",
  ru: "🇷🇺",
  pl: "🇵🇱",
  cs: "🇨🇿",
  uk: "🇺🇦",
  bg: "🇧🇬",
  hi: "🇮🇳",
  sa: "🇮🇳",
  fa: "🇮🇷",
  el: "🇬🇷",
  grc: "🏛️",
  la: "🏛️",
};

export default function CognatesPanel({ word }: CognatesPanelProps) {
  const [showCognates, setShowCognates] = useAtom(showCognatesPanelAtom);
  const [cognatesWord, setCognatesWord] = useAtom(cognatesWordAtom);

  const activeWord = word || cognatesWord;

  const { data: cognates, isLoading, error } = useQuery({
    queryKey: ["cognates", activeWord],
    queryFn: () => fetchCognates(activeWord!),
    enabled: !!activeWord && showCognates,
    staleTime: 5 * 60 * 1000,
  });

  const handleClose = () => {
    setShowCognates(false);
    setCognatesWord(null);
  };

  const handlePronounce = (word: string, langCode: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      const langMap: Record<string, string> = {
        en: "en-US",
        de: "de-DE",
        fr: "fr-FR",
        es: "es-ES",
        it: "it-IT",
        pt: "pt-PT",
        ru: "ru-RU",
        el: "el-GR",
        nl: "nl-NL",
        pl: "pl-PL",
      };
      utterance.lang = langMap[langCode] || "en-US";
      speechSynthesis.speak(utterance);
    }
  };

  if (!showCognates || !activeWord) return null;

  return (
    <DraggablePanel
      title="Cross-Language Cognates"
      icon={<Globe className="w-5 h-5 text-cyan-500" />}
      onClose={handleClose}
      className="fixed right-4 top-20 w-[420px] max-h-[80vh] dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border rounded-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex flex-col flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="letters" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load cognates</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : cognates ? (
          <div className="overflow-y-auto flex-1 space-y-4">
            {/* Source word and proto-root */}
            <div className="p-4 rounded-lg dark:bg-gray-900/50 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-serif">{cognates.sourceWord}</span>
                <span className="text-sm text-gray-500">
                  ({cognates.sourceLanguage})
                </span>
              </div>
              {cognates.protoRoot && (
                <div className="mt-2">
                  <span className="text-xs dark:text-gray-500 text-gray-500">
                    Proto-Indo-European:
                  </span>
                  <span className="ml-2 font-mono text-sm">
                    {cognates.protoRoot}
                  </span>
                  {cognates.protoMeaning && (
                    <span className="text-sm dark:text-gray-400 text-gray-600 ml-2">
                      "{cognates.protoMeaning}"
                    </span>
                  )}
                </div>
              )}
              {cognates.languageFamilyTree && (
                <p className="text-xs dark:text-gray-500 text-gray-500 mt-2">
                  {cognates.languageFamilyTree}
                </p>
              )}
            </div>

            {/* Cognates list */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium dark:text-gray-400 text-gray-500">
                Cognates across languages ({cognates.cognates.length})
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {cognates.cognates.map((cognate, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg dark:bg-gray-900/30 bg-gray-50/30 hover:dark:bg-gray-900/50 hover:bg-gray-100/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {languageFlags[cognate.languageCode] || "🌐"}
                        </span>
                        <div>
                          <span className="text-lg font-serif">
                            {cognate.script || cognate.word}
                          </span>
                          {cognate.script && cognate.script !== cognate.word && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({cognate.word})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handlePronounce(cognate.word, cognate.languageCode)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-700/30"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            cognate.relationship === "direct"
                              ? "bg-green-500/20 text-green-400"
                              : cognate.relationship === "indirect"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {cognate.relationship}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs dark:text-gray-500 text-gray-500">
                        {cognate.language}
                      </span>
                      {cognate.pronunciation && (
                        <span className="text-xs text-gray-500">
                          /{cognate.pronunciation}/
                        </span>
                      )}
                    </div>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                      "{cognate.meaning}"
                    </p>
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
