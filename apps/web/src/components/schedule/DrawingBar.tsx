"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { addBlocked } from "@/components/preferences/blockedTimes";
import { BlockTimeDialog } from "@/components/preferences/BlockTimeDialog";
import { usePhoneScreen } from "@/components/phone/phoneScreen";
import type { Day } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";

const LINK = "inline-flex min-h-24 cursor-pointer items-center rounded-badge font-650 underline-offset-2 hover:underline";

const focusToggle = () => document.getElementById("tutorial-block-time")?.focus();

/**
 * The slim bar above the calendar in drawing mode: "Drag on the calendar to block time · Type a time
 * instead · Done". Escape, Done, another screen or any dialog turns drawing mode off.
 */
export function DrawingBar() {
  const drawing = usePlanner((state) => state.drawing);
  const setDrawing = usePlanner((state) => state.setDrawing);
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const screen = usePhoneScreen((state) => state.screen);
  const bar = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState(false);
  const [refocus, setRefocus] = useState(0);

  useEffect(() => () => setDrawing(false), [setDrawing]);

  useEffect(() => {
    if (screen !== "schedule") setDrawing(false);
  }, [screen, setDrawing]);

  const leaveOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (bar.current?.contains(document.activeElement)) focusToggle();
    setDrawing(false);
  });

  useEffect(() => {
    if (!drawing) return;
    const leave = (event: KeyboardEvent) => leaveOnEscape(event);
    const watch = new MutationObserver(() => {
      if (document.querySelector("dialog[open]")) setDrawing(false);
    });
    window.addEventListener("keydown", leave);
    watch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => {
      window.removeEventListener("keydown", leave);
      watch.disconnect();
    };
  }, [drawing, setDrawing]);

  // The button that opened the form is gone with the bar, so focus goes back to the toggle.
  useEffect(() => {
    if (refocus > 0) focusToggle();
  }, [refocus]);

  function closeForm() {
    setTyping(false);
    setRefocus((count) => count + 1);
  }

  function handleSubmit(days: Day[], start: number, end: number, label: string) {
    setPreferences({ blocked: addBlocked(blocked, days, start, end, label) });
    closeForm();
  }

  return (
    <>
      {drawing && (
        <div
          ref={bar}
          role="group"
          aria-label="Drawing mode"
          className="flex shrink-0 flex-wrap items-center gap-x-6 border-b border-accent-line bg-accent-soft px-12 py-3 text-9 leading-13 text-accent"
        >
          <p className="basis-full tablet:basis-auto">Drag on the calendar to block time</p>
          <span aria-hidden className="hidden tablet:inline">·</span>
          <button
            type="button"
            className={LINK}
            onClick={() => {
              setDrawing(false);
              setTyping(true);
            }}
          >
            Type a time instead
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            className={LINK}
            onClick={() => {
              focusToggle();
              setDrawing(false);
            }}
          >
            Done
          </button>
        </div>
      )}
      <BlockTimeDialog open={typing} onClose={closeForm} onSubmit={handleSubmit} />
    </>
  );
}
