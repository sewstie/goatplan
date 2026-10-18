import { ENGINE_API_VERSION, type SolveRequest } from "@/lib/engine/types";
import { SORT_PRESETS } from "./sortPresets";
import type { Draft } from "./types";

/** How many schedules the switcher can page through. The engine allows up to 500. */
export const MAX_SCHEDULES = 200;

/**
 * The engine request for a plan, or null when there is nothing to solve (the engine needs at least
 * one course). Locks only go in for courses in the plan, and only when something is locked.
 */
export function buildRequest(plan: Pick<Draft, "courses" | "preferences" | "locks" | "sortPreset">): SolveRequest | null {
  const courses = [...new Set(plan.courses)];
  if (courses.length === 0) return null;

  const locked: Record<string, string[]> = {};
  for (const code of courses) {
    const sectionIds = [...new Set(plan.locks[code] ?? [])];
    if (sectionIds.length > 0) locked[code] = sectionIds;
  }

  return {
    version: ENGINE_API_VERSION,
    courses,
    preferences: {
      startsAfter: plan.preferences.startsAfter,
      blocked: plan.preferences.blocked.map((block) => ({ ...block })),
      onlyOpen: plan.preferences.onlyOpen,
      locked,
    },
    sort: { ...SORT_PRESETS[plan.sortPreset].weights },
    limits: { maxSchedules: MAX_SCHEDULES },
  };
}
