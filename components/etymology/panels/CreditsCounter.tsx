"use client";

import { useEffect, useState } from "react";
import { getCreditsUsed, getRemainingCredits } from "../utils/credits";
import { MAX_CREDITS } from "../utils/constants";

export default function CreditsCounter() {
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

  const remaining = MAX_CREDITS - creditsUsed;
  const percentage = (remaining / MAX_CREDITS) * 100;

  return (
    <div className="fixed bottom-4 right-4 px-3 py-1.5 rounded-lg dark:bg-gray-800/90 bg-white/90 backdrop-blur-sm dark:border-gray-700/50 border-gray-200/50 border shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage > 50
                ? "bg-green-500"
                : percentage > 20
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm font-medium">
          <span className="text-blue-500">{remaining}</span> / {MAX_CREDITS}
        </p>
      </div>
    </div>
  );
}
