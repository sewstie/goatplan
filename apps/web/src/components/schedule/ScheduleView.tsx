"use client";

import { usePlanner } from "@/lib/store";
import { BlockedSelectionBar } from "./BlockedSelectionBar";
import { BlockedTimeMenu } from "./BlockedTimeMenu";
import { DrawingBar } from "./DrawingBar";
import { EmptyCalendar } from "./EmptyCalendar";
import { EngineMessage } from "./EngineMessage";
import { LoadingCalendar } from "./LoadingCalendar";
import { PlanCalendar } from "./PlanCalendar";
import { TermErrorCalendar } from "./TermErrorCalendar";

/** Schedule agent: the weekly calendar (div.app-6.md and the calendar states). */
export function ScheduleView() {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const termStatus = usePlanner((state) => state.termStatus);
  const hasCourses = usePlanner((state) => state.courses.length > 0);
  const hasBlockedTimes = usePlanner((state) => state.preferences.blocked.length > 0);
  const response = usePlanner((state) => state.response);
  const solveStatus = usePlanner((state) => state.solveStatus);
  const drawing = usePlanner((state) => state.drawing);

  return (
    <>
      <DrawingBar />
      {calendar()}
      <BlockedTimeMenu />
      <BlockedSelectionBar />
    </>
  );

  function calendar() {
    if (saved) return <PlanCalendar />;
    if (termStatus === "error") return <TermErrorCalendar />;
    if (termStatus !== "ready") return <LoadingCalendar />;
    // In drawing mode an empty plan gets the plain grid, so a first blocked time can be drawn before any course.
    if (!hasCourses && !hasBlockedTimes) return drawing ? <PlanCalendar /> : <EmptyCalendar />;
    if (hasCourses && (solveStatus === "error" || (solveStatus === "done" && response?.ok === false))) {
      return <PlanCalendar overlay={<EngineMessage />} />;
    }
    if (response?.ok && response.diagnosis?.unsure && solveStatus === "done") {
      return <PlanCalendar overlay={<EngineMessage unsure />} />;
    }
    // While drawing, the grid stays put through each solve so the drawn times don't flicker away.
    if (!drawing && hasCourses && (!response?.ok || response.schedules.length === 0) && (solveStatus === "waiting" || solveStatus === "solving")) {
      return <LoadingCalendar caption="Finding schedules…" />;
    }
    return <PlanCalendar />;
  }
}
