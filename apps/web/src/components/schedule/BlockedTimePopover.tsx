"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { floatingPosition } from "@/components/ui/floatingPosition";
import { DAY_NAMES } from "@/lib/data/days";
import { formatTimeRange } from "@/lib/data/time";
import type { PlanBlockedTime } from "@/lib/store";

type BlockedTimePopoverProps = {
  id: string;
  block: PlanBlockedTime;
  anchor: HTMLElement;
  /** Off when the time is outside the form's choices (7 AM to 10 PM). */
  canRename: boolean;
  onRename(): void;
  onRemove(): void;
  /** focusAnchor: Escape gives focus back to the block; a click elsewhere leaves it there. */
  onClose(focusAnchor: boolean): void;
};

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex='-1'])";

/** The next place Tab would go after the element, outside the card. */
function focusAfter(element: HTMLElement, card: HTMLElement | null) {
  const all = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (item) => !card?.contains(item) && (item.checkVisibility?.() ?? true),
  );
  const next = all[all.indexOf(element) + 1];
  (next ?? element).focus();
}

/**
 * The small card a blocked time opens: its name, day and time, Rename and Remove. It renders into
 * the body like a portal Tooltip, so the calendar card can't clip it, and closes on scroll.
 */
export function BlockedTimePopover({ id, block, anchor, canRename, onRename, onRemove, onClose }: BlockedTimePopoverProps) {
  const card = useRef<HTMLDivElement>(null);
  const title = block.label?.trim() || "Blocked time";

  useLayoutEffect(() => {
    const box = card.current;
    if (!box) return;
    const { left, top } = floatingPosition(
      anchor.getBoundingClientRect(),
      box.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
      { gap: 6 },
    );
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.visibility = "visible";
    box.querySelector("button")?.focus({ preventScroll: true });
  }, [anchor]);

  useEffect(() => {
    const inside = (target: EventTarget | null) => target instanceof Node && !!card.current?.contains(target);
    const away = (event: Event) => {
      if (!inside(event.target) && !(event.target instanceof Node && anchor.contains(event.target))) onClose(false);
    };
    const scrolled = (event: Event) => {
      if (!inside(event.target)) onClose(false);
    };
    const resized = () => onClose(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", resized);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", resized);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={card}
      id={id}
      role="dialog"
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose(true);
          return;
        }
        if (event.key !== "Tab") return;
        // The card sits at the end of the page, so Tab out of it goes back to where the block is.
        const buttons = [...(card.current?.querySelectorAll("button") ?? [])];
        if (event.shiftKey && event.target === buttons[0]) {
          event.preventDefault();
          onClose(true);
        } else if (!event.shiftKey && event.target === buttons.at(-1)) {
          event.preventDefault();
          onClose(false);
          focusAfter(anchor, card.current);
        }
      }}
      className="invisible fixed z-30 flex w-200 flex-col gap-2 rounded-card border border-line-popover bg-surface px-12 py-10 shadow-popover"
    >
      <p className="truncate text-10 leading-14-5 font-700">{title}</p>
      <p className="text-9 leading-13 text-ink-muted">
        {DAY_NAMES[block.day]} {formatTimeRange(block.start, block.end, "shared")}
      </p>
      <div className="flex gap-6 pt-8">
        {canRename && (
          <Button variant="secondary" size="sm" onClick={onRename}>
            Rename
          </Button>
        )}
        <Button variant="warning" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>,
    document.body,
  );
}
