export const MAX_CREDITS = 15;
export const CREDITS_KEY = "etymon_credits_used";
export const CREDITS_TIMESTAMP_KEY = "etymon_credits_timestamp";
export const CREDITS_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
export const CACHE_PREFIX = "etymon_cache_";
export const CACHE_EXPIRY = 60 * 60 * 1000; // 60 minutes in milliseconds
export const HISTORY_KEY = "etymon_search_history";
export const MAX_HISTORY_ITEMS = 10;

// Layout constants
export const WORD_CHUNK_PADDING = 3;
export const ORIGIN_PADDING = 10;
export const VERTICAL_SPACING = 50;

// Origin colors for language tags
export const ORIGIN_COLORS: Record<string, string> = {
  greek:
    "dark:bg-green-500/20 bg-green-500/10 dark:text-green-300 text-green-600",
  latin: "dark:bg-red-500/20 bg-red-500/10 dark:text-red-300 text-red-600",
  spanish:
    "dark:bg-orange-500/20 bg-orange-500/10 dark:text-orange-300 text-orange-600",
  romance:
    "dark:bg-orange-500/20 bg-orange-500/10 dark:text-orange-300 text-orange-600",
  french:
    "dark:bg-purple-500/20 bg-purple-500/10 dark:text-purple-300 text-purple-600",
  german:
    "dark:bg-yellow-500/20 bg-yellow-500/10 dark:text-yellow-300 text-yellow-600",
  germanic:
    "dark:bg-yellow-500/20 bg-yellow-500/10 dark:text-yellow-300 text-yellow-600",
  arabic:
    "dark:bg-cyan-500/20 bg-cyan-500/10 dark:text-cyan-300 text-cyan-600",
  semitic:
    "dark:bg-cyan-500/20 bg-cyan-500/10 dark:text-cyan-300 text-cyan-600",
  sanskrit:
    "dark:bg-pink-500/20 bg-pink-500/10 dark:text-pink-300 text-pink-600",
  indo: "dark:bg-pink-500/20 bg-pink-500/10 dark:text-pink-300 text-pink-600",
  russian:
    "dark:bg-blue-500/20 bg-blue-500/10 dark:text-blue-300 text-blue-600",
  slavic:
    "dark:bg-blue-500/20 bg-blue-500/10 dark:text-blue-300 text-blue-600",
  chinese:
    "dark:bg-amber-500/20 bg-amber-500/10 dark:text-amber-300 text-amber-600",
  japanese:
    "dark:bg-rose-500/20 bg-rose-500/10 dark:text-rose-300 text-rose-600",
  default:
    "dark:bg-gray-500/20 bg-gray-500/10 dark:text-gray-300 text-gray-600",
};

// Typing animation words
export const TYPING_WORDS = [
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
];

// Fascinating words for Word of the Day / Random Discovery
export const FASCINATING_WORDS = [
  "serendipity",
  "ephemeral",
  "mellifluous",
  "petrichor",
  "sonder",
  "phosphorescence",
  "halcyon",
  "luminescence",
  "susurrus",
  "quintessential",
  "metamorphosis",
  "transcendence",
  "ethereal",
  "iridescent",
  "enigmatic",
  "labyrinthine",
  "synesthesia",
  "epiphany",
  "nostalgia",
  "melancholy",
  "euphoria",
  "wanderlust",
  "bibliophile",
  "polyglot",
  "renaissance",
  "eloquence",
  "resonance",
  "aurora",
  "constellation",
  "nebula",
  "infinity",
  "paradox",
  "catalyst",
  "synchronicity",
  "phenomenon",
  "cosmos",
  "genesis",
  "apotheosis",
  "chrysalis",
  "catharsis",
  "algorithm",
  "kaleidoscope",
  "ubiquitous",
  "effervescent",
  "phantasmagoria",
  "incandescent",
  "onomatopoeia",
  "pandemonium",
  "silhouette",
  "clandestine",
];
