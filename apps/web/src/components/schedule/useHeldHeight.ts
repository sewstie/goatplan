"use client";

import { useCallback, useState, type CSSProperties } from "react";

/**
 * While active, the element keeps the tallest height it has had, so it never shrinks and moves what
 * comes after it. Used above the calendar in drawing mode, so the grid stays put between drags. A new
 * window width (a resized window, a turned tablet) starts over, since rows can wrap differently. The
 * element's own width doesn't count: "Schedule 1 of 4" and "0 schedules fit" differ in width.
 */
export function useHeldHeight<T extends HTMLElement>(active: boolean): [(node: T | null) => (() => void) | undefined, CSSProperties | undefined] {
  const [held, setHeld] = useState(0);
  const ref = useCallback(
    (node: T | null) => {
      if (!node || !active || typeof ResizeObserver === "undefined") return;
      let width = window.innerWidth;
      const observer = new ResizeObserver(([entry]) => {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        const resized = window.innerWidth !== width;
        width = window.innerWidth;
        setHeld((current) => (resized ? 0 : Math.max(current, height)));
      });
      observer.observe(node);
      return () => observer.disconnect();
    },
    [active],
  );
  if (!active && held !== 0) setHeld(0);
  return [ref, active && held > 0 ? { minHeight: held } : undefined];
}
