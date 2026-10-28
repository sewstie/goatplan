"use client";

import { useShallow } from "zustand/react/shallow";
import type { Course } from "@/lib/data/types";
import { selectChosenSections, usePlanner } from "@/lib/store";

const NONE: string[] = [];

/** The course's sections to show: the schedule's choice, or the last one and the locks while it solves. */
export function useShownSections(course: Course) {
  const code = course.code;
  const chosen = usePlanner(useShallow((state) => selectChosenSections(state)[code] ?? NONE));
  const locked = usePlanner((state) => state.locks[code] ?? NONE);
  const busy = usePlanner((state) => state.solveStatus === "waiting" || state.solveStatus === "solving");
  const previous = usePlanner((state) => state.lastChosenSections[code] ?? NONE);
  // Only a real answer can say nothing fits: an engine error or a crashed worker says nothing about the plan.
  const answered = usePlanner((state) => state.solveStatus === "done" && state.response?.ok === true && !state.response.diagnosis?.unsure);

  // With no schedule for this course, locked sections stay visible so they can be unlocked.
  const displayed = busy ? [...new Set([...previous.map((id) => {
    const type = course.sections.find((section) => section.id === id)?.type;
    return locked.find((lock) => course.sections.some((section) => section.id === lock && section.type === type)) ?? id;
  }), ...locked])] : chosen.length > 0 ? chosen : locked;

  return { chosen, locked, busy, answered, displayed };
}
