"use client";

import { useEffect, type KeyboardEvent } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/IconButton";
import { selectSchedules, usePlanner } from "@/lib/store";
import { CountPill } from "./CountPill";

const MOVES: Readonly<Record<string, "previous" | "next">> = { ArrowLeft: "previous", ArrowRight: "next" };

// The arrows use aria-disabled at the ends so they keep focus, so the disabled look is set here.
// Ticket 11: min-w-44 min-h-44 ensures 44px touch targets on phone.
const ARROW_DISABLED = "aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:hover:bg-surface";
const ARROW_TOUCH = "min-w-44 min-h-44";
// The compact arrows look 30px but keep a 44px hit area.
const ARROW_COMPACT = "relative size-30 after:absolute after:-inset-7";

/** Schedule agent: "Schedule 3 of 24" with arrows, or "0 schedules fit", next to the title. */
export function ScheduleSwitcher({ compact = false, wide = false }: { compact?: boolean; wide?: boolean }) {
  const skeleton = <span aria-hidden className={wide ? "h-44 w-full rounded-row bg-skeleton" : "h-26 w-130 rounded-badge bg-skeleton"} />;
  const termStatus = usePlanner((state) => state.termStatus);
  const hasCourses = usePlanner((state) => state.courses.length > 0);
  const response = usePlanner((state) => state.response);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const count = usePlanner((state) => selectSchedules(state).length);
  const index = usePlanner((state) => state.scheduleIndex);
  const previousSchedule = usePlanner((state) => state.previousSchedule);
  const nextSchedule = usePlanner((state) => state.nextSchedule);
  const canBrowse = count > 1 && solveStatus === "done";

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
    return skeleton;
  }
  if (termStatus !== "ready" || !hasCourses) return null;
  if (solveStatus === "error") return null;
  if (solveStatus === "waiting" || solveStatus === "solving") {
    return skeleton;
  }
  if (!response) {
    return solveStatus === "idle" ? null : skeleton;
  }
  if (!response.ok) return null;
  if (response.diagnosis?.unsure) return <CountPill tone="alert" wide={wide}>Search incomplete</CountPill>;
  if (response.total === 0) return <CountPill tone="alert" wide={wide}>0 schedules fit</CountPill>;
  if (!canBrowse) return <CountPill compact={compact} wide={wide}>Schedule 1 of 1</CountPill>;

  function handleKeyDown(event: KeyboardEvent) {
    const direction = MOVES[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  }

  const atStart = index === 0;
  const atEnd = index >= count - 1;
  return (
    <div role="group" aria-label="Schedules" className={compact ? "flex shrink-0 items-center gap-6" : wide ? "flex w-full items-center gap-8" : "flex flex-wrap items-center gap-x-8 gap-y-4"} onKeyDown={handleKeyDown}>
      <IconButton
        label="Previous schedule"
        icon={<CaretLeft aria-hidden />}
        aria-disabled={atStart}
        aria-keyshortcuts="ArrowLeft"
        onClick={() => !atStart && previousSchedule()}
        className={`${compact ? ARROW_COMPACT : ARROW_TOUCH} ${ARROW_DISABLED}`}
      />
      <CountPill compact={compact} wide={wide}>
        Schedule {index + 1} of {count.toLocaleString("en-US")}
      </CountPill>
      <IconButton
        label="Next schedule"
        icon={<CaretRight aria-hidden />}
        aria-disabled={atEnd}
        aria-keyshortcuts="ArrowRight"
        onClick={() => !atEnd && nextSchedule()}
        className={`${compact ? ARROW_COMPACT : ARROW_TOUCH} ${ARROW_DISABLED}`}
      />
    </div>
  );
}
