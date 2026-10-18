"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { scheduleItems, type ScheduleItems } from "./scheduleItems";

/** The blocks, untimed sections and waitlist notes of the schedule being shown. */
export function useScheduleItems(): ScheduleItems {
  const term = usePlanner((state) => state.term);
  const courses = usePlanner((state) => state.courses);
  const locks = usePlanner((state) => state.locks);
  const chosen = usePlanner(useShallow(selectChosenSections));
  return useMemo(() => scheduleItems(term, courses, chosen, locks), [term, courses, chosen, locks]);
}
