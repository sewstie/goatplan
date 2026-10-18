"use client";

import { useEffect, type KeyboardEvent } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/IconButton";
import { selectSchedules, usePlanner } from "@/lib/store";
import { CountPill } from "./CountPill";

const MOVES: Readonly<Record<string, "previous" | "next">> = { ArrowLeft: "previous", ArrowRight: "next" };

// The arrows use aria-disabled at the ends so they keep focus, so the disabled look is set here.
const ARROW_DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:hover:bg-surface";

/** Schedule agent: "Schedule 3 of 24" with arrows, or "0 schedules fit", next to the title. */
export function ScheduleSwitcher() {
  const termStatus = usePlanner((state) => state.termStatus);
  const hasCourses = usePlanner((state) => state.courses.length > 0);
  const response = usePlanner((state) => state.response);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const count = usePlanner((state) => selectSchedules(state).length);
  const index = usePlanner((state) => state.scheduleIndex);
  const previousSchedule = usePlanner((state) => state.previousSchedule);
  const nextSchedule = usePlanner((state) => state.nextSchedule);
  const canBrowse = count > 1;

  const move = (direction: "previous" | "next") => (direction === "next" ? nextSchedule() : previousSchedule());

  // With nothing focused, the arrow keys still page through schedules.
  useEffect(() => {
    if (!canBrowse) return;
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const direction = MOVES[event.key];
      const idle = event.target === document.body || (event.target as Element | null)?.id === "main";
      if (!direction || !idle || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      move(direction);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  if (termStatus === "idle" || termStatus === "loading") {
    return <span aria-hidden className="h-26 w-130 rounded-badge bg-skeleton" />;
  }
  if (termStatus !== "ready" || !hasCourses) return null;
  if (!response) {
    return solveStatus === "idle" ? null : <span aria-hidden className="h-26 w-130 rounded-badge bg-skeleton" />;
  }
  if (!response.ok) return null;
  if (response.total === 0) return <CountPill tone="alert">0 schedules fit</CountPill>;
  if (!canBrowse) return <CountPill>Schedule 1 of 1</CountPill>;

  function handleKeyDown(event: KeyboardEvent) {
    const direction = MOVES[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  }

  const atStart = index === 0;
  const atEnd = index >= count - 1;
  return (
    <div role="group" aria-label="Schedules" className="flex items-center gap-7" onKeyDown={handleKeyDown}>
      <IconButton
        label="Previous schedule"
        icon={<CaretLeft aria-hidden />}
        aria-disabled={atStart}
        aria-keyshortcuts="ArrowLeft"
        onClick={() => !atStart && previousSchedule()}
        className={ARROW_DISABLED}
      />
      <CountPill>
        Schedule {index + 1} of {count.toLocaleString("en-US")}
      </CountPill>
      <IconButton
        label="Next schedule"
        icon={<CaretRight aria-hidden />}
        aria-disabled={atEnd}
        aria-keyshortcuts="ArrowRight"
        onClick={() => !atEnd && nextSchedule()}
        className={ARROW_DISABLED}
      />
    </div>
  );
}
