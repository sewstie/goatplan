"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { DotsThree } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";

const modalOpen = () => document.querySelector("dialog:modal") !== null;

/**
 * Below the wide breakpoint its children sit in a "⋯" menu, and from there up they sit in the bar. It's one
 * set of elements either way, so the dialogs they open aren't mounted twice.
 */
export function BarMoreMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!modalOpen() && !root.current?.contains(event.target as Node)) setOpen(false);
    };
    const leave = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || modalOpen()) return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", leave);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", leave);
    };
  }, [open]);

  if (Children.toArray(children).length === 0) return null;

  return (
    <div ref={root} className="relative wide:contents">
      <button
        ref={trigger}
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex size-36 cursor-pointer items-center justify-center rounded-row border border-line-button bg-surface text-ink hover:bg-surface-selected wide:hidden"
      >
        <DotsThree aria-hidden weight="bold" className="size-18" />
      </button>
      <div
        className={cx(
          "absolute top-[calc(100%+--spacing(6))] right-0 z-30 w-max flex-col items-stretch gap-6 rounded-card border border-line-popover bg-surface p-8 shadow-popover wide:contents",
          open ? "flex" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
