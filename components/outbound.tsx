"use client";

import { Coffee, Github, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TOOLTIP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOOLTIP_DURATION = 5000; // 5 seconds
const TOOLTIP_STORAGE_KEY = "last_tooltip_time";

function CoffeeButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<"center" | "right">(
    "center"
  );

  useEffect(() => {
    setMounted(true);

    // Check if enough time has passed since the last tooltip
    const showPeriodicTooltip = () => {
      const lastShown = localStorage.getItem(TOOLTIP_STORAGE_KEY);
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown) >= TOOLTIP_INTERVAL) {
        setShowTooltip(true);
        localStorage.setItem(TOOLTIP_STORAGE_KEY, now.toString());

        setTimeout(() => {
          setShowTooltip(false);
        }, TOOLTIP_DURATION);
      }
    };

    const intervalId = setInterval(showPeriodicTooltip, TOOLTIP_INTERVAL);
    showPeriodicTooltip(); // Check immediately on mount

    return () => clearInterval(intervalId);
  }, []);

  // Adjust tooltip position when it becomes visible
  useEffect(() => {
    if (showTooltip && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // If tooltip would be cut off on the left, position it to the right
      if (containerRect.left < tooltipRect.width / 2) {
        setTooltipPosition("right");
      } else {
        setTooltipPosition("center");
      }
    }
  }, [showTooltip]);

  if (!mounted) return null;

  return (
    <div className="relative" ref={containerRef}>
      <Link
        href="https://buymeacoffee.com/rumiallbert"
        target="_blank"
        className="dark:text-gray-400 text-gray-600 hover:dark:text-gray-100 hover:text-gray-900 transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Coffee className="w-5 h-5" />
      </Link>
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute ${
            tooltipPosition === "center"
              ? "left-1/2 -translate-x-1/2"
              : "left-0 translate-x-0"
          } top-full mt-2 whitespace-nowrap z-50`}
        >
          <div className="bg-black/90 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg animate-fade-in relative">
            Like my work? Consider buying me a coffee ☕
            <div
              className={`absolute ${
                tooltipPosition === "center"
                  ? "left-1/2 -translate-x-1/2"
                  : "left-[28px] -translate-x-1/2"
              } bottom-full w-2 h-2 bg-black/90 rotate-45`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Outbound() {
  return (
    <div className="flex gap-4">
      <Link
        href="https://rumiallbert.com"
        target="_blank"
        className="dark:text-gray-400 text-gray-600 hover:dark:text-gray-100 hover:text-gray-900 transition-colors"
      >
        <Home className="w-5 h-5" />
      </Link>
      <Link
        href="https://github.com/rumiallbert/etymon"
        target="_blank"
        className="dark:text-gray-400 text-gray-600 hover:dark:text-gray-100 hover:text-gray-900 transition-colors"
      >
        <Github className="w-5 h-5" />
      </Link>
      <CoffeeButton />
    </div>
  );
}
