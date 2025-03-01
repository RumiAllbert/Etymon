"use client";

import { useEffect, useState } from "react";

export default function Spinner({
  variant,
}: {
  variant?: "letters" | "roots" | "wordTree" | "classic" | "random";
}) {
  // For random variant, select one of the preferred variants
  const [selectedVariant, setSelectedVariant] = useState(variant);

  useEffect(() => {
    if (variant === "random" || !variant) {
      const preferredVariants = ["letters", "roots", "wordTree", "classic"];
      const randomIndex = Math.floor(Math.random() * preferredVariants.length);
      setSelectedVariant(preferredVariants[randomIndex] as any);
    } else {
      setSelectedVariant(variant);
    }
  }, [variant]);

  // Classic spinner (original implementation)
  if (selectedVariant === "classic") {
    return (
      <svg
        className="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );
  }

  // Enhanced Letters animation - cycling through diverse alphabets and scripts with more Greek letters
  if (selectedVariant === "letters") {
    return (
      <div className="flex items-center justify-center h-5 overflow-hidden">
        <div className="flex flex-col animate-bounce-slow">
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            α
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            β
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            γ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            δ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ε
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            文
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ζ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            η
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            θ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ι
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            κ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            λ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            字
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            μ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ν
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ξ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ο
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            π
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ρ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ℵ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            σ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            τ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            υ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            φ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            א
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            χ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ψ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            Ω
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ᚠ
          </span>
          <span className="text-lg font-serif h-5 flex items-center justify-center">
            ह
          </span>
        </div>
      </div>
    );
  }

  // Enhanced Roots animation - a more complex root structure
  if (selectedVariant === "roots") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main trunk */}
        <path
          d="M12 2V8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-path"
        />

        {/* Primary roots */}
        <path
          d="M12 8V22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-path-delay-1"
        />
        <path
          d="M12 14L7 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-branch-1"
        />
        <path
          d="M12 14L17 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-branch-2"
        />
        <path
          d="M12 10L5 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-branch-3"
        />
        <path
          d="M12 10L19 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-branch-4"
        />

        {/* Secondary roots */}
        <path
          d="M7 19L5 21"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-5"
        />
        <path
          d="M7 19L9 21"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-6"
        />
        <path
          d="M17 19L15 21"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-5"
        />
        <path
          d="M17 19L19 21"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-6"
        />

        {/* Tertiary roots */}
        <path
          d="M5 17L3 19"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-7"
        />
        <path
          d="M19 17L21 19"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-7"
        />

        {/* Root nodes */}
        <circle
          cx="12"
          cy="8"
          r="1"
          fill="currentColor"
          className="animate-pulse"
        />
        <circle
          cx="12"
          cy="14"
          r="0.7"
          fill="currentColor"
          className="animate-pulse-delay-1"
        />
        <circle
          cx="12"
          cy="10"
          r="0.7"
          fill="currentColor"
          className="animate-pulse-delay-2"
        />
      </svg>
    );
  }

  // Enhanced Word Tree animation - a more complex tree visualization with more connections
  if (selectedVariant === "wordTree") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main stem */}
        <path
          d="M12 2V6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-path"
        />

        {/* Primary branches */}
        <path
          d="M12 6L6 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-branch-1"
        />
        <path
          d="M12 6L18 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-grow-branch-2"
        />

        {/* Secondary branches - left side */}
        <path
          d="M6 12L3 15"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="animate-grow-branch-3"
        />
        <path
          d="M6 12L9 15"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="animate-grow-branch-4"
        />

        {/* Secondary branches - right side */}
        <path
          d="M18 12L15 15"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="animate-grow-branch-3"
        />
        <path
          d="M18 12L21 15"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="animate-grow-branch-4"
        />

        {/* Tertiary branches */}
        <path
          d="M3 15L2 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-5"
        />
        <path
          d="M3 15L4 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-6"
        />
        <path
          d="M9 15L8 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-5"
        />
        <path
          d="M9 15L10 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-6"
        />
        <path
          d="M15 15L14 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-5"
        />
        <path
          d="M15 15L16 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-6"
        />
        <path
          d="M21 15L20 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-5"
        />
        <path
          d="M21 15L22 18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="animate-grow-branch-6"
        />

        {/* Connection nodes */}
        <circle
          cx="12"
          cy="6"
          r="1"
          fill="currentColor"
          className="animate-pulse"
        />
        <circle
          cx="6"
          cy="12"
          r="0.8"
          fill="currentColor"
          className="animate-pulse-delay-1"
        />
        <circle
          cx="18"
          cy="12"
          r="0.8"
          fill="currentColor"
          className="animate-pulse-delay-1"
        />
        <circle
          cx="3"
          cy="15"
          r="0.6"
          fill="currentColor"
          className="animate-pulse-delay-2"
        />
        <circle
          cx="9"
          cy="15"
          r="0.6"
          fill="currentColor"
          className="animate-pulse-delay-2"
        />
        <circle
          cx="15"
          cy="15"
          r="0.6"
          fill="currentColor"
          className="animate-pulse-delay-2"
        />
        <circle
          cx="21"
          cy="15"
          r="0.6"
          fill="currentColor"
          className="animate-pulse-delay-2"
        />
      </svg>
    );
  }

  // Default to classic if variant is not recognized
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
