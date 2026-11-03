"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { cx } from "./cx";
import { floatingPosition } from "./floatingPosition";

type PopoverProps = {
  id: string;
  /** The heading's id. */
  labelledBy: string;
  /** The button that opens it. The popover lines up with its right edge and gives focus back to it. */
  anchor: RefObject<HTMLElement | null>;
  onClose(): void;
  /** Gets focus on open. Without it, the first button or field does. */
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
};

const MARGIN = 8;
const focusable = "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex='-1'])";

/**
 * A non-modal dialog under its button, like the Sort list: no backdrop, the page stays usable.
 * Escape, a click outside or the button again closes it. It sits right after the button in the
 * page, so Tab goes from the button into it.
 */
export function Popover({ id, labelledBy, anchor, onClose, initialFocus, children, className }: PopoverProps) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    function place() {
      if (!element || !anchor.current) return;
      const button = anchor.current.getBoundingClientRect();
      const size = element.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const { left, top } = floatingPosition(button, { width: size.width, height: 0 }, viewport, { offsetX: button.width - size.width, margin: MARGIN });
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      element.style.maxHeight = `${viewport.height - top - MARGIN}px`;
      element.style.visibility = "visible";
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  useEffect(() => {
    const first = initialFocus?.current ?? box.current?.querySelector<HTMLElement>(focusable);
    first?.focus();
  }, [initialFocus]);

  useEffect(() => {
    const backToButton = () => anchor.current?.focus();
    function away(event: PointerEvent) {
      const target = event.target as Element | null;
      if (!target || box.current?.contains(target) || anchor.current?.contains(target)) return;
      close.current();
      // A click on something that can't take focus would leave focus nowhere; the button gets it back.
      if (!target.closest(focusable)) setTimeout(backToButton);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      close.current();
      backToButton();
    }
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [anchor]);

  return (
    <div
      ref={box}
      id={id}
      role="dialog"
      aria-labelledby={labelledBy}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !box.current?.contains(next) && !anchor.current?.contains(next)) close.current();
      }}
      className={cx(
        "invisible fixed z-40 flex w-360 max-w-[calc(100vw-16px)] flex-col overflow-y-auto overscroll-contain rounded-card border border-line-popover bg-surface p-16 text-left text-ink shadow-listbox",
        className,
      )}
    >
      {children}
    </div>
  );
}
