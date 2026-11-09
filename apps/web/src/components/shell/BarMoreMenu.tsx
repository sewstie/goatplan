"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DotsThree } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { ModalReturnFocusContext } from "@/components/ui/useModalDialog";

const modalOpen = () => document.querySelector("dialog:modal") !== null;

/** The phone's "⋯" menu. Its children stay mounted while it's closed, so the dialogs they open keep their state. */
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

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let hadDialog = false;
    const observer = new MutationObserver(() => {
      const hasDialog = element.querySelector("dialog[open]") !== null;
      if (hadDialog && !hasDialog) {
        setOpen(false);
        if (!modalOpen()) trigger.current?.focus();
      }
      hadDialog = hasDialog;
    });
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (open && !modalOpen() && !root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex size-44 cursor-pointer items-center justify-center rounded-row border border-line-button bg-surface text-ink hover:bg-surface-selected"
      >
        <DotsThree aria-hidden weight="bold" className="size-18" />
      </button>
      <div
        className={cx(
          "absolute top-[calc(100%+--spacing(6))] right-0 z-30 w-max flex-col items-stretch gap-6 rounded-card border border-line-popover bg-surface p-8 shadow-popover",
          open ? "flex" : "hidden",
        )}
      >
        <ModalReturnFocusContext value={trigger}>{children}</ModalReturnFocusContext>
      </div>
    </div>
  );
}
