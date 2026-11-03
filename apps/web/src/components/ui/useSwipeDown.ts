import { useRef, useState, type PointerEvent } from "react";

/** How far a finger has to pull a bottom sheet down before letting go closes it. */
export const SWIPE_CLOSE_DISTANCE = 80;

/**
 * Pulling a bottom sheet down by its top edge. `offset` follows the finger; letting go past
 * SWIPE_CLOSE_DISTANCE calls `dismiss`, otherwise the sheet goes back. A mouse never drags it.
 */
export function useSwipeDown<T extends HTMLElement>(dismiss: () => void) {
  const start = useRef<{ y: number; id: number } | null>(null);
  const [offset, setOffset] = useState(0);

  function end(event: PointerEvent<T>) {
    if (!start.current || event.pointerId !== start.current.id) return;
    const distance = event.clientY - start.current.y;
    start.current = null;
    setOffset(0);
    if (distance >= SWIPE_CLOSE_DISTANCE) dismiss();
  }

  return {
    offset,
    handlers: {
      onPointerDown(event: PointerEvent<T>) {
        if (event.pointerType === "mouse") return;
        start.current = { y: event.clientY, id: event.pointerId };
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // A pointer the browser no longer tracks can't be captured; the moves still arrive here.
        }
      },
      onPointerMove(event: PointerEvent<T>) {
        if (!start.current || event.pointerId !== start.current.id) return;
        setOffset(Math.max(0, event.clientY - start.current.y));
      },
      onPointerUp: end,
      onPointerCancel(event: PointerEvent<T>) {
        if (!start.current || event.pointerId !== start.current.id) return;
        start.current = null;
        setOffset(0);
      },
    },
  };
}
