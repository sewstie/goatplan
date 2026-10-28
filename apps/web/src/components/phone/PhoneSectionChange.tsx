"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CaretRight, CaretUp } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";

type PhoneSectionChangeProps = {
  /** "lecture" or "lab", as in "Change lab". */
  kind: string;
  /** "2 other times". */
  label: string;
  /** Shown above the list, like "Unlock CX02 to choose another lab." */
  note?: string;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

/** "Change lab · 2 other times" under a section card, opening the other choices below it. */
export function PhoneSectionChange({ kind, label, note, open, busy, onOpenChange, children }: PhoneSectionChangeProps) {
  const listId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  // After a pick closes the list, focus would fall to the page; it goes back to this button instead.
  useEffect(() => {
    if (wasOpen.current && !open && document.activeElement === document.body) button.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <div onKeyDown={(event) => {
      if (event.key !== "Escape" || !open) return;
      event.stopPropagation();
      onOpenChange(false);
      button.current?.focus();
    }}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={open && !busy ? listId : undefined}
        aria-disabled={busy}
        onClick={() => { if (!busy) onOpenChange(!open); }}
        className={cx("flex min-h-44 w-full items-center gap-10 rounded-badge px-4 text-left", busy ? "cursor-wait opacity-60" : "cursor-pointer")}
      >
        <span className="text-10 font-570 text-accent">Change {kind}</span>{" "}
        <span className="text-9 text-ink-muted">{label}</span>
        {open ? <CaretUp aria-hidden className="ml-auto size-14 shrink-0 text-ink" /> : <CaretRight aria-hidden className="ml-auto size-14 shrink-0 text-ink" />}
      </button>
      {open && !busy && (
        <div id={listId} className="flex flex-col gap-12 pb-4">
          {note && <p className="px-4 text-9 text-ink-muted">{note}</p>}
          <ul aria-label={`Other ${kind} choices`} className="flex flex-col divide-y divide-line overflow-hidden rounded-message border border-line bg-surface">
            {children}
          </ul>
        </div>
      )}
    </div>
  );
}
