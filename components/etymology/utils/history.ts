import { type Definition } from "@/utils/schema";
import { HISTORY_KEY, MAX_HISTORY_ITEMS } from "./constants";
import { normalizeWord } from "./helpers";

export interface SearchHistoryItem {
  word: string;
  timestamp: number;
  meaning?: string;
  origin?: string;
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Add a word to search history
 */
export function addToSearchHistory(
  word: string,
  definition?: Definition
): void {
  if (typeof window === "undefined") return;

  try {
    const history = getSearchHistory();
    const normalizedWord = normalizeWord(word);

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
      if (!definition) {
        newEntry.meaning = history[existingIndex].meaning;
        newEntry.origin = history[existingIndex].origin;
      }
      history.splice(existingIndex, 1);
    }

    const newHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch {
    // Ignore
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Group history items by date
 */
export function groupHistoryByDate(
  items: SearchHistoryItem[]
): Record<string, SearchHistoryItem[]> {
  const groups: Record<string, SearchHistoryItem[]> = {
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
}
