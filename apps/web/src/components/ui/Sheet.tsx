"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";
import { IconButton } from "./IconButton";
import { useModalDialog } from "./useModalDialog";

export type SheetSide = "right" | "bottom";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  /** Along the right edge (the default), or across the bottom of the screen, as on a phone. */
  side?: SheetSide;
};

const sideClasses: Record<SheetSide, { dialog: string; body: string }> = {
  right: {
    dialog: "my-0 mr-0 ml-auto h-dvh max-h-dvh w-[calc(var(--size-details)+2*var(--size-app-padding))] max-w-[calc(100vw-32px)] rounded-l-panel",
    body: "h-full py-20",
  },
  // Full width and as tall as its content, up to 85% of the screen. It slides up as it opens.
  bottom: {
    dialog: "mx-0 mt-auto mb-0 w-full max-w-none max-h-[85dvh] rounded-t-panel transition-[translate] duration-200 ease-out starting:translate-y-full motion-reduce:transition-none",
    body: "max-h-[85dvh] pt-20 pb-[max(20px,env(safe-area-inset-bottom))]",
  },
};

const tabStops = "a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";

/**
 * Keeps Tab and Shift+Tab inside the sheet: past the last stop, focus goes back to the first, and
 * the other way round. The page behind is already inert while the sheet is open.
 */
function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !event.currentTarget.contains(active)) return;
  const stops = [...event.currentTarget.querySelectorAll<HTMLElement>(tabStops)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled, input[type=hidden], [inert] *") &&
      (element.checkVisibility?.({ visibilityProperty: true }) ?? true),
  );
  const ahead = (element: HTMLElement) => active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;
  const behind = (element: HTMLElement) => active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING;
  const next = event.shiftKey
    ? !stops.some(behind) && stops.at(-1)
    : !stops.some(ahead) && stops[0];
  if (stops.length === 0 || next) {
    event.preventDefault();
    if (next) next.focus();
  }
}

export function Sheet({ open, onClose, title, children, side = "right" }: SheetProps) {
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const { ref, handleClose, handlePointerDown, handleBackdropClick, close } = useModalDialog(open, onClose);

  // The browser would focus the Close button; start at the heading instead, so a screen reader
  // reads the title first. This runs after useModalDialog has opened the sheet.
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
      onKeyDown={keepFocusInside}
      className={cx("bg-surface p-0 text-ink shadow-popover backdrop:bg-scrim", sideClasses[side].dialog)}
    >
      <div className={cx("flex flex-col gap-12 overflow-y-auto px-16", sideClasses[side].body)}>
        <div className="flex items-start justify-between gap-12">
          <h2 ref={heading} id={titleId} tabIndex={-1} className="text-21 leading-25-2 font-700 tracking-heading outline-none">
            {title}
          </h2>
          <IconButton
            variant="ghost"
            label="Close"
            icon={<X />}
            onClick={close}
            className="mt-6 text-ink-muted [&_svg]:size-12"
          />
        </div>
        {children}
      </div>
    </dialog>
  );
}
