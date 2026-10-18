"use client";

import { useCallback, useState } from "react";

/** A ref for an element and its current height in px (null until measured). */
export function useElementHeight<T extends HTMLElement>(): [(node: T | null) => (() => void) | undefined, number | null] {
  const [height, setHeight] = useState<number | null>(null);
  const ref = useCallback((node: T | null) => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, height];
}
