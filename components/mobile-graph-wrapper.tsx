"use client";

import { TouchEvent, useState } from "react";

export const MobileGraphWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [scale, setScale] = useState(1);
  const handlePinch = (e: TouchEvent) => {
    // Implement pinch-to-zoom logic
  };

  return (
    <div className="md:hidden w-full overflow-hidden touch-pan-x touch-pan-y">
      <div style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
};
