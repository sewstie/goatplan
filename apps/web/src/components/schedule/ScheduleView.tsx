"use client";

import { usePlanner } from "@/lib/store";
import { EmptyCalendar } from "./EmptyCalendar";
import { LoadingCalendar } from "./LoadingCalendar";
import { PlanCalendar } from "./PlanCalendar";
import { TermErrorCalendar } from "./TermErrorCalendar";

/** Schedule agent: the weekly calendar (div.app-6.md and the calendar states). */
export function ScheduleView() {
  const termStatus = usePlanner((state) => state.termStatus);
  const hasCourses = usePlanner((state) => state.courses.length > 0);

  if (termStatus === "error") return <TermErrorCalendar />;
  if (termStatus !== "ready") return <LoadingCalendar />;
  if (!hasCourses) return <EmptyCalendar />;
  return <PlanCalendar />;
}
