"use client";

import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  isLoadingAtom,
  inputValueAtom,
  showHistoryAtom,
} from "../utils/atoms";
import { TYPING_WORDS, FASCINATING_WORDS } from "../utils/constants";
import { getSearchHistory, addToSearchHistory } from "../utils/history";
import Spinner from "@/components/spinner";
import { Shuffle, Clock } from "lucide-react";

interface InputNodeProps {
  data: {
    onSubmit: (word: string) => Promise<void>;
    initialWord?: string;
  };
}

function useTypingAnimation(
  words: string[],
  typingSpeed = 150,
  deletingSpeed = 100,
  pauseDuration = 2000
) {
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
}

export default function InputNode({ data }: InputNodeProps) {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const [showHistory, setShowHistory] = useAtom(showHistoryAtom);
  const history = getSearchHistory();

  const placeholder = useTypingAnimation(TYPING_WORDS, 100, 50, 2000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    await Promise.all([
      data.onSubmit(inputValue),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    addToSearchHistory(inputValue);
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsLoading(false);
  };

  const handleRandomWord = async () => {
    if (isLoading) return;
    const randomWord =
      FASCINATING_WORDS[Math.floor(Math.random() * FASCINATING_WORDS.length)];
    setInputValue(randomWord);
    setIsLoading(true);
    await Promise.all([
      data.onSubmit(randomWord),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    addToSearchHistory(randomWord);
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsLoading(false);
  };

  useEffect(() => {
    if (data.initialWord) {
      setInputValue(data.initialWord);
    }
  }, [data.initialWord, setInputValue]);

  return (
    <div className="flex flex-col items-center gap-4 px-4 sm:px-0 w-full max-w-xl">
      <div className="flex items-center gap-2">
        <a
          href="/"
          className="text-2xl sm:text-4xl font-serif dark:text-gray-100 text-gray-900 hover:opacity-80 transition-opacity"
          title="Go to home page"
        >
          Etymon.ai
        </a>
        <span className="px-2 py-0.5 text-xs font-medium dark:bg-blue-500/20 bg-blue-500/10 dark:text-blue-300 text-blue-600 rounded-full">
          beta
        </span>
      </div>
      <form
        className={`w-full px-4 sm:px-6 py-4 rounded-xl dark:bg-gray-800/80 bg-white/80 dark:border-gray-700/50 border-gray-200/50 border shadow-xl flex flex-col sm:flex-row gap-3 ${
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
          <button
            type="button"
            onClick={handleRandomWord}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg dark:bg-gray-700/50 bg-gray-100/50 hover:dark:bg-gray-600/50 hover:bg-gray-200/50 dark:text-gray-300 text-gray-700 transition-colors disabled:opacity-50"
            title="Random word"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              disabled={isLoading}
              className="px-3 py-2 rounded-lg dark:bg-gray-700/50 bg-gray-100/50 hover:dark:bg-gray-600/50 hover:bg-gray-200/50 dark:text-gray-300 text-gray-700 transition-colors disabled:opacity-50"
              title="View search history"
            >
              <Clock className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none sm:w-[120px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {isLoading ? <Spinner variant="random" /> : "Etymologize"}
          </button>
        </div>
      </form>
    </div>
  );
}
