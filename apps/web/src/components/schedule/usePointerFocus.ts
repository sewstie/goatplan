import { useRef, useState, type FocusEvent, type PointerEvent } from "react";

/**
 * For a focusable box like the calendar grid: true while it got focus from a click, not from Tab.
 * Chrome shows the focus ring on the next key press, even Space, so the box hides it itself.
 */
export function usePointerFocus<T extends HTMLElement>() {
  const pressed = useRef(false);
  const [byPointer, setByPointer] = useState(false);

  return {
    byPointer,
    handlers: {
      onPointerDown(event: PointerEvent<T>) {
        pressed.current = true;
        if (document.activeElement === event.currentTarget) setByPointer(true);
      },
      onPointerUp() {
        pressed.current = false;
      },
      onPointerCancel() {
        pressed.current = false;
      },
      onFocus(event: FocusEvent<T>) {
        if (event.target === event.currentTarget) setByPointer(pressed.current);
        pressed.current = false;
      },
      onBlur(event: FocusEvent<T>) {
        if (event.target === event.currentTarget) setByPointer(false);
      },
    },
  };
}
