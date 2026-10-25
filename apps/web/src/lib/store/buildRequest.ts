import { ENGINE_API_VERSION, type SolveRequest, type SortWeights } from "@/lib/engine/types";
import type { TermFile } from "@/lib/data/types";
import { lecturesByProfessor } from "@/lib/data/instructors";
import { SORT_PRESETS } from "./sortPresets";
import type { Draft } from "./types";

/** How many schedules the switcher can page through. The engine allows up to 500. */
export const MAX_SCHEDULES = 200;

/** Best overall's weights. Every sort sends them, so score.total means the same in every sort. */
const SORT_WEIGHTS: Readonly<Required<SortWeights>> = {
  earlyCutoff: 600,
  perEarlyMinute: 3,
  perGapMinute: 1,
  perDay: 60,
  lateCutoff: 1440,
  perLateMinute: 0,
};

/**
 * The engine request for a plan, or null when there is nothing to solve (the engine needs at least
 * one course). Locks only go in for courses in the plan, and only when something is locked. The sort
 * sends Best overall's weights plus the preset's primary measure; Best overall sends no primary.
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
      anyOf[code] = [...new Set(lecturesByProfessor(sections, name).map((section) => section.id))];
    }
  }

  const primary = SORT_PRESETS[plan.sortPreset].primary;
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
    sort: primary ? { ...SORT_WEIGHTS, primary } : { ...SORT_WEIGHTS },
    limits: { maxSchedules: MAX_SCHEDULES },
  };
}
