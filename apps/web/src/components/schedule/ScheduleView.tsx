"use client";

import { usePlanner } from "@/lib/store";
import { EmptyCalendar } from "./EmptyCalendar";
import { EngineMessage } from "./EngineMessage";
import { LoadingCalendar } from "./LoadingCalendar";
import { PlanCalendar } from "./PlanCalendar";
import { TermErrorCalendar } from "./TermErrorCalendar";

/** Schedule agent: the weekly calendar (div.app-6.md and the calendar states). */
export function ScheduleView() {
  const termStatus = usePlanner((state) => state.termStatus);
  const hasCourses = usePlanner((state) => state.courses.length > 0);
  const hasBlockedTimes = usePlanner((state) => state.preferences.blocked.length > 0);
  const response = usePlanner((state) => state.response);
  const solveStatus = usePlanner((state) => state.solveStatus);

  if (termStatus === "error") return <TermErrorCalendar />;
  if (termStatus !== "ready") return <LoadingCalendar />;
  if (!hasCourses && !hasBlockedTimes) return <EmptyCalendar />;
  if (hasCourses && (solveStatus === "error" || (solveStatus === "done" && response?.ok === false))) {
    return <PlanCalendar overlay={<EngineMessage />} />;
  }
  if (response?.ok && response.diagnosis?.unsure && solveStatus === "done") {
    return <PlanCalendar overlay={<EngineMessage unsure />} />;
  }
  if (hasCourses && (!response?.ok || response.schedules.length === 0) && (solveStatus === "waiting" || solveStatus === "solving")) {
    return <LoadingCalendar caption="Finding schedules…" />;
  }
  return <PlanCalendar />;
}
