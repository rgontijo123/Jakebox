"use client";

import { useState } from "react";

/** Pricing-card highlight: the hovered card is highlighted while the mouse is
 * over it, otherwise the last clicked/tapped one (starting on `defaultId`,
 * the "most popular" card). */
export function useCardSelection(defaultId: string) {
  const [selectedId, setSelectedId] = useState(defaultId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const activeId = hoverId ?? selectedId;

  return {
    isActive: (id: string) => id === activeId,
    cardProps: (id: string) => ({
      onMouseEnter: () => setHoverId(id),
      onMouseLeave: () => setHoverId(null),
      onClick: () => setSelectedId(id),
    }),
  };
}
