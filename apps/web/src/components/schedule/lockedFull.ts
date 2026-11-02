import type { Course, Section } from "@/lib/data/types";
import type { PlannerState } from "@/lib/store";

export interface LockedFull {
  course: Course;
  section: Section;
}

/**
 * A locked section that filled up since the term file was made is the reason nothing fits, as long as
 * "Only open sections" is on. A section already full in the term file is left to the usual diagnosis.
 */
export function selectLockedFull(state: Pick<PlannerState, "term" | "seatsUpdatedAt" | "locks" | "courses" | "preferences" | "response" | "solveStatus" | "drawing" | "savedPlanId">): LockedFull | null {
  if (!state.term || state.savedPlanId !== null || state.drawing || !state.preferences.onlyOpen) return null;
  if (!state.seatsUpdatedAt || Date.parse(state.seatsUpdatedAt) <= Date.parse(state.term.generatedAt)) return null;
  if (state.solveStatus !== "done" || state.response?.ok !== true || state.response.total !== 0) return null;
  for (const code of state.courses) {
    const course = state.term.courses.find((item) => item.code === code);
    if (!course) continue;
    for (const id of state.locks[code] ?? []) {
      const section = course.sections.find((item) => item.id === id);
      if (section && section.status !== "open") return { course, section };
    }
  }
  return null;
}
