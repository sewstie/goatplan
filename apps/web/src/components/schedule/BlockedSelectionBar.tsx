"use client";

import { useEffect, useEffectEvent, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { WEEK } from "@/lib/data/days";
import { usePlanner } from "@/lib/store";
import { count } from "./scheduleCopy";
import { blockedKey, useBlockedTimeMenu } from "./useBlockedTimeMenu";

const focusToggle = () => document.getElementById("tutorial-block-time")?.focus();

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * "2 selected · Delete · Clear" over the bottom of the calendar while blocked times are picked with
 * ⌘-click or Ctrl-click. Delete or Backspace removes them, with one Undo; Escape clears the pick. It
 * floats, so picking never moves the grid.
 */
export function BlockedSelectionBar() {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const changeBlocked = usePlanner((state) => state.changeBlocked);
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const selected = useBlockedTimeMenu((state) => state.selected);
  const clearSelected = useBlockedTimeMenu((state) => state.clearSelected);
  const picked = useMemo(() => blocked.filter((block) => selected.includes(blockedKey(block))), [blocked, selected]);

  // Times removed or changed some other way drop out of the pick.
  useEffect(() => {
    if (picked.length !== selected.length) useBlockedTimeMenu.setState({ selected: picked.map(blockedKey) });
  }, [picked, selected]);

  useEffect(() => {
    if (saved) clearSelected();
  }, [saved, clearSelected]);

  useEffect(() => clearSelected, [clearSelected]);

  function remove() {
    if (picked.length === 0) return;
    const days = WEEK.filter((day) => picked.some((block) => block.day === day));
    changeBlocked(blocked.filter((block) => !picked.includes(block)), {
      days,
      start: Math.min(...picked.map((block) => block.start)),
      end: Math.max(...picked.map((block) => block.end)),
      erased: true,
      count: picked.length,
    });
    clearSelected();
    focusToggle();
  }

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (document.querySelector("dialog[open]") || event.defaultPrevented) return;
    if (event.key === "Escape") {
      // Before drawing mode's own Escape, so the first one only clears the pick.
      event.preventDefault();
      clearSelected();
    } else if ((event.key === "Delete" || event.key === "Backspace") && !typing(event.target)) {
      event.preventDefault();
      remove();
    }
  });

  const active = picked.length > 0;
  useEffect(() => {
    if (!active) return;
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [active]);

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {active ? `${count("blocked time", picked.length)} selected. Press Delete to remove.` : ""}
      </p>
      {active && (
        <div
          role="group"
          aria-label="Selected blocked times"
          className="absolute bottom-36 left-1/2 z-20 flex -translate-x-1/2 items-center gap-8 rounded-card border border-line-popover bg-surface py-6 pr-6 pl-14 text-10 leading-14-5 whitespace-nowrap shadow-popover"
        >
          <p className="font-600">{picked.length} selected</p>
          <Button variant="warning" size="sm" onClick={remove}>
            Delete
          </Button>
          <Button variant="secondary" size="sm" onClick={clearSelected}>
            Clear
          </Button>
        </div>
      )}
    </>
  );
}
