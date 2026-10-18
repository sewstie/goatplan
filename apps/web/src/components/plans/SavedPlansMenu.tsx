"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CaretDown, Check } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { countLabel, sectionCount, type SavedPlan } from "@/lib/plans";

type SavedPlansMenuProps = {
  /** This term's plans, or null before they're read. */
  plans: SavedPlan[] | null;
  termName: string | null;
  currentPlan: SavedPlan | null;
  disabled: boolean;
  canSaveAsNew: boolean;
  onOpenPlan: (plan: SavedPlan) => void;
  onSaveAsNew: () => void;
};

const itemClasses =
  "flex w-full cursor-pointer items-center gap-8 rounded-row px-8 py-7 text-left text-10 leading-14-5 text-ink hover:bg-surface-selected";

/** "Saved plans ⌄": this term's plans and the ways to the plans page. A disclosure, not an ARIA menu. */
export function SavedPlansMenu({
  plans,
  termName,
  currentPlan,
  disabled,
  canSaveAsNew,
  onOpenPlan,
  onSaveAsNew,
}: SavedPlansMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (disabled && open) setOpen(false);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function item(key: string, content: ReactNode, action: { href: string } | { onClick: () => void }) {
    return (
      <li key={key}>
        {"href" in action ? (
          <Link href={action.href} className={itemClasses} onClick={() => setOpen(false)}>
            {content}
          </Link>
        ) : (
          <button
            type="button"
            className={itemClasses}
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
          >
            {content}
          </button>
        )}
      </li>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close(true);
        }
      }}
      onBlur={(event) => {
        if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex cursor-pointer items-center gap-5 rounded-badge py-4 text-10 leading-14-5 text-ink-soft enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
      >
        Saved plans
        <CaretDown aria-hidden className={cx("size-10 transition-transform", open && "rotate-180")} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-[calc(100%+6px)] right-0 z-30 w-260 rounded-card border border-line-popover bg-surface p-6 shadow-popover"
      >
        {termName && (
          <p className="px-8 pt-4 pb-4 text-9 leading-13 font-600 text-ink-muted">{termName}</p>
        )}
        {plans && plans.length > 0 ? (
          <ul aria-label={termName ? `Saved plans for ${termName}` : "Saved plans"}>
            {plans.map((plan) =>
              item(
                plan.id,
                <>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-650">{plan.name}</span>
                    <span className="text-9 leading-13 text-ink-muted">
                      {countLabel(plan.schedule.length, "course")} · {countLabel(sectionCount(plan), "section")}
                    </span>
                  </span>
                  {plan.id === currentPlan?.id && (
                    <>
                      <Check aria-hidden className="size-12 shrink-0 text-accent" />
                      <span className="sr-only">(open now)</span>
                    </>
                  )}
                </>,
                { onClick: () => onOpenPlan(plan) },
              ),
            )}
          </ul>
        ) : (
          <p className="px-8 py-6 text-9 leading-13 text-ink-muted">
            {termName ? `No saved plans for ${termName} yet.` : "No saved plans yet."}
          </p>
        )}
        <ul aria-label="Plan actions" className="mt-6 border-t border-line pt-6">
          {currentPlan &&
            item("register", "Sections to register", { href: `/plans?plan=${encodeURIComponent(currentPlan.id)}` })}
          {canSaveAsNew && item("save-new", "Save as a new plan", { onClick: onSaveAsNew })}
          {item("all", "All saved plans", { href: "/plans" })}
          {pathname !== "/" && item("planner", "Back to planner", { href: "/" })}
        </ul>
      </div>
    </div>
  );
}
