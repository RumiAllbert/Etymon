import {
  MAX_CREDITS,
  CREDITS_KEY,
  CREDITS_TIMESTAMP_KEY,
  CREDITS_INTERVAL,
} from "./constants";

/**
 * Check if we're in a new credits interval
 */
function isNewInterval(timestamp: number): boolean {
  return Date.now() - timestamp >= CREDITS_INTERVAL;
}

/**
 * Get the number of credits used
 */
export function getCreditsUsed(): number {
  if (typeof window === "undefined") return 0;

  const timestamp = parseInt(
    localStorage.getItem(CREDITS_TIMESTAMP_KEY) || "0",
    10
  );

  if (isNewInterval(timestamp)) {
    localStorage.setItem(CREDITS_KEY, "0");
    localStorage.setItem(CREDITS_TIMESTAMP_KEY, Date.now().toString());
    return 0;
  }

  return parseInt(localStorage.getItem(CREDITS_KEY) || "0", 10);
}

/**
 * Get the number of remaining credits
 */
export function getRemainingCredits(): number {
  return MAX_CREDITS - getCreditsUsed();
}

/**
 * Check if user has credits available
 */
export function hasCreditsAvailable(): boolean {
  return getCreditsUsed() < MAX_CREDITS;
}

/**
 * Increment the credits used
 */
export function incrementCreditsUsed(): void {
  if (typeof window === "undefined") return;

  const current = getCreditsUsed();
  localStorage.setItem(CREDITS_KEY, (current + 1).toString());
  localStorage.setItem(CREDITS_TIMESTAMP_KEY, Date.now().toString());

  // Dispatch event for components to update
  try {
    const event = new Event("credits_updated");
    window.dispatchEvent(event);
  } catch {
    // Ignore
  }
}

/**
 * Get the timestamp of last credit use
 */
export function getCreditsTimestamp(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(CREDITS_TIMESTAMP_KEY) || "0", 10);
}

/**
 * Get time until credits refresh
 */
export function getTimeUntilRefresh(): { hours: number; minutes: number } {
  const timestamp = getCreditsTimestamp();
  const timeLeft = CREDITS_INTERVAL - (Date.now() - timestamp);

  if (timeLeft <= 0) {
    return { hours: 0, minutes: 0 };
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
