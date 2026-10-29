"use client";

import { useEffect, type KeyboardEvent } from "react";
import { cx } from "@/components/ui/cx";
import { selectSchedules, usePlanner } from "@/lib/store";
import { CountPill } from "./CountPill";
import { PositionText } from "./PositionText";
import { StepperBox, type StepperSize } from "./StepperBox";

const MOVES: Readonly<Record<string, "previous" | "next">> = { ArrowLeft: "previous", ArrowRight: "next" };

/** Schedule agent: "Schedule 3 of 24" with arrows, or "0 schedules fit", next to the title. */
export function ScheduleSwitcher({ compact = false, wide = false }: { compact?: boolean; wide?: boolean }) {
  const size: StepperSize = compact ? "compact" : wide ? "wide" : "default";
  const skeleton = <span aria-hidden className={cx("rounded-row bg-skeleton", wide ? "h-44 w-full" : compact ? "h-30 w-130" : "h-35 w-185")} />;
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
  if (!canBrowse) {
    return (
      <StepperBox size={size}>
        <PositionText noun="Schedule" index={1} total={1} size={size} />
      </StepperBox>
    );
  }

  function handleKeyDown(event: KeyboardEvent) {
    const direction = MOVES[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  }

  const atStart = index === 0;
  const atEnd = index >= count - 1;
  return (
    <StepperBox
      label="Schedules"
      size={size}
      previous={{ label: "Previous schedule", disabled: atStart, onClick: previousSchedule, shortcut: "ArrowLeft" }}
      next={{ label: "Next schedule", disabled: atEnd, onClick: nextSchedule, shortcut: "ArrowRight" }}
      onKeyDown={handleKeyDown}
    >
      <PositionText noun="Schedule" index={index + 1} total={count} size={size} />
    </StepperBox>
  );
}
