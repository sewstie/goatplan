"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretDown, X } from "@phosphor-icons/react/ssr";
import { count } from "@/components/schedule/scheduleCopy";
import { cx } from "@/components/ui/cx";
import { usePlanner } from "@/lib/store";
import { groupBlocked, groupDays, groupTimes, removeGroup } from "./blockedTimes";

/**
 * In drawing mode, all blocked times as one pill of a fixed width, "3 blocked times ⌄", with a list
 * to remove each, so drawing doesn't add pills and push the calendar down. A disclosure, not a menu.
 */
export function BlockedTimesMenu({ className }: { className?: string }) {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const changeBlocked = usePlanner((state) => state.changeBlocked);
  const groups = useMemo(() => groupBlocked(blocked), [blocked]);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const removedIndex = useRef<number | null>(null);
  const empty = groups.length === 0;

  if (empty && open) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // After a remove, focus goes to the next remove button, or back to "Block a time" when none are left.
  useEffect(() => {
    const index = removedIndex.current;
    if (index === null) return;
    removedIndex.current = null;
    const buttons = root.current?.querySelectorAll<HTMLButtonElement>("li button") ?? [];
    const next = buttons[Math.min(index, buttons.length - 1)];
    if (next) next.focus();
    else document.getElementById("tutorial-block-time")?.focus();
  }, [groups]);

  return (
    <div
      ref={root}
      className={cx("relative inline-flex", className)}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        // Closes the list only; drawing mode stays on.
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }}
      onBlur={(event) => {
        if (open && !root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={empty}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-32 w-full min-w-132 cursor-pointer items-center justify-between gap-6 rounded-pill bg-surface px-10 text-9 leading-13 whitespace-nowrap text-ink enabled:hover:bg-surface-selected disabled:cursor-default disabled:text-ink-muted"
      >
        {empty ? "No blocked times" : count("blocked time", groups.length)}
        {!empty && <CaretDown aria-hidden className={cx("size-10 transition-transform", open && "rotate-180")} />}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-[calc(100%+6px)] left-0 z-30 w-280 max-w-[calc(100vw-32px)] rounded-card border border-line-popover bg-surface p-6 shadow-popover"
      >
        <ul aria-label="Blocked times" className="flex flex-col">
          {groups.map((group, index) => {
            const days = groupDays(group);
            const times = groupTimes(group);
            return (
              <li key={`${group.label}-${group.start}-${group.end}`} className="flex items-center gap-8 rounded-control py-2 pr-2 pl-8 text-9 leading-13">
                <span className="min-w-0 flex-1">
                  {group.label && <b className="font-650">{group.label} · </b>}
                  {days} {times}
                </span>
                <button
                  type="button"
                  aria-label={`Remove blocked time ${group.label ? `${group.label}, ` : ""}${days} ${times}`}
                  onClick={() => {
                    removedIndex.current = index;
                    changeBlocked(removeGroup(blocked, group), { days: group.days, start: group.start, end: group.end, erased: true });
                  }}
                  className="flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink hover:bg-surface-selected"
                >
                  <X aria-hidden className="size-12" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
