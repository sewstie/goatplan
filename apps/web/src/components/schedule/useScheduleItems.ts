"use client";

import { useMemo } from "react";
import { selectSavedPlan, selectViewedSchedule, usePlanner } from "@/lib/store";
import { scheduleItems, type ScheduleItems } from "./scheduleItems";

/** The blocks, untimed sections and waitlist notes of the schedule being shown. */
export function useScheduleItems(): ScheduleItems {
  const courses = usePlanner((state) => selectSavedPlan(state)?.courses ?? state.courses);
  const locks = usePlanner((state) => selectSavedPlan(state)?.locks ?? state.locks);
  const viewed = usePlanner(selectViewedSchedule);
  return useMemo(() => {
    const ids = Object.fromEntries((viewed ?? []).map((course) => [course.code, course.sections.map((section) => section.id)]));
    return scheduleItems(viewed ? { courses: viewed } : null, courses, ids, locks);
  }, [courses, locks, viewed]);
}
