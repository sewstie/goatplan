import { ENGINE_API_VERSION, type SolveRequest } from "@/lib/engine/types";
import type { TermFile } from "@/lib/data/types";
import { hasInstructor } from "@/lib/data/instructors";
import { SORT_PRESETS } from "./sortPresets";
import type { Draft } from "./types";

/** How many schedules the switcher can page through. The engine allows up to 500. */
export const MAX_SCHEDULES = 200;

/**
 * The engine request for a plan, or null when there is nothing to solve (the engine needs at least
 * one course). Locks only go in for courses in the plan, and only when something is locked.
 */
export function buildRequest(plan: Pick<Draft, "courses" | "preferences" | "locks" | "sortPreset"> & {
  professorByCourse?: Draft["professorByCourse"];
  term?: TermFile | null;
}): SolveRequest | null {
  const courses = [...new Set(plan.courses)];
  if (courses.length === 0) return null;

  const locked: Record<string, string[]> = {};
  const anyOf: Record<string, string[]> = {};
  for (const code of courses) {
    const sectionIds = [...new Set(plan.locks[code] ?? [])];
    if (sectionIds.length > 0) locked[code] = sectionIds;
    const name = plan.professorByCourse?.[code];
    if (name) {
      const sections = plan.term?.courses.find((course) => course.code === code)?.sections ?? [];
      anyOf[code] = [...new Set(sections.filter((section) => hasInstructor(section, name)).map((section) => section.id))];
    }
  }

  return {
    version: ENGINE_API_VERSION,
    courses,
    preferences: {
      startsAfter: plan.preferences.startsAfter,
      blocked: plan.preferences.blocked.map(({ day, start, end }) => ({ day, start, end })),
      onlyOpen: plan.preferences.onlyOpen,
      locked,
      anyOf,
    },
    sort: { ...SORT_PRESETS[plan.sortPreset].weights },
    limits: { maxSchedules: MAX_SCHEDULES },
  };
}
