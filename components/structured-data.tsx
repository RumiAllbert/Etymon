"use client";

import { useEffect } from "react";

interface StructuredDataProps {
  word?: string;
  definition?: string;
}

export default function StructuredData({
  word,
  definition,
}: StructuredDataProps) {
  useEffect(() => {
    if (!word) return;

    // Create and inject JSON-LD script
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: word,
      description: definition || `Etymology and origin of the word "${word}"`,
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        name: "Etymon.ai Word Etymology Database",
      },
      url: `https://etymon.rumiallbert.com/word/${encodeURIComponent(
        word.toLowerCase()
      )}`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://etymon.rumiallbert.com/word/${encodeURIComponent(
          word.toLowerCase()
        )}`,
      },
    };

    script.textContent = JSON.stringify(structuredData);

    // Remove any existing JSON-LD scripts
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());

    // Add the new script
    document.head.appendChild(script);

    return () => {
      // Clean up
      script.remove();
    };
  }, [word, definition]);

  return null;
}
