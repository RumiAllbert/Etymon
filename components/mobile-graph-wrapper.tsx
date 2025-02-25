"use client";

import { useState } from "react";

export const MobileGraphWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [scale] = useState(1);

  return (
    <div className="md:hidden w-full overflow-hidden touch-pan-x touch-pan-y">
      <div style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
};
