"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keeps a sideways scroller where the user left it. Hiding it with display: none sends it back to the
 * start, so when it shows again it scrolls back to the last place it was seen. Safari reports a scroll
 * to the start as it reappears; that one doesn't count.
 */
export function useKeptScrollLeft(scroller: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = scroller.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    let left = element.scrollLeft;
    let hidden = false;
    const remember = () => {
      if (!hidden) left = element.scrollLeft;
    };
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === 0) {
        hidden = true;
        return;
      }
      if (!hidden) return;
      hidden = false;
      element.scrollLeft = left;
    });
    element.addEventListener("scroll", remember, { passive: true });
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", remember);
      observer.disconnect();
    };
  }, [scroller]);
}
