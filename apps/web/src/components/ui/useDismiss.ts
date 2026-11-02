"use client";

import { useEffect, type RefObject } from "react";

/** Closes a small popup on a press outside it or on Escape, and keeps that Escape from closing anything behind it. */
export function useDismiss(open: boolean, root: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const leave = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", leave);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", leave);
    };
  }, [open, root, close]);
}
