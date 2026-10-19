import { selectChosenSections, type PlannerState } from "@/lib/store";
import type { SavedPlan } from "./types";

export type PlanSource = Pick<
  PlannerState,
  "termId" | "term" | "courses" | "locks" | "professorByCourse" | "preferences" | "sortPreset" | "response" | "scheduleIndex" | "alternatives"
>;

export const MAX_PLAN_NAME_LENGTH = 60;

/**
 * A plan with its own copy of the sections in the shown schedule, or null when there is nothing to
 * save yet (no term loaded or no schedule shown).
 */
export function createPlan(
  state: PlanSource,
  details: { id: string; name: string; savedAt: Date },
): SavedPlan | null {
  const { termId, term } = state;
  if (!termId || !term || term.term.id !== termId) return null;
  const chosen = selectChosenSections(state);
  const codes = state.courses.filter((code) => chosen[code]);
  if (codes.length === 0) return null;

  const courses = new Map(term.courses.map((course) => [course.code, course]));
  const schedule = codes.map((code) => {
    const course = courses.get(code)!;
    const sections = chosen[code]
      .map((id) => course.sections.find((section) => section.id === id))
      .filter((section) => section !== undefined);
    return { code, title: course.title, sections: structuredClone(sections) };
  });
  if (schedule.some((course) => course.sections.length === 0)) return null;

  const kept = new Set(state.courses);
  const locks = Object.fromEntries(
    Object.entries(state.locks).filter(([code, ids]) => kept.has(code) && ids.length > 0).map(([code, ids]) => [code, [...ids]]),
  );

  return {
    id: details.id,
    name: details.name,
    termId,
    term: { name: term.term.name, season: term.term.season, year: term.term.year },
    savedAt: details.savedAt.toISOString(),
    courses: [...state.courses],
    schedule,
    locks,
    professorByCourse: Object.fromEntries(Object.entries(state.professorByCourse).filter(([code]) => kept.has(code))),
    preferences: structuredClone(state.preferences),
    sortPreset: state.sortPreset,
  };
}

/** The plan's new contents, keeping its id and name. */
export function updatePlan(plan: SavedPlan, state: PlanSource, savedAt: Date): SavedPlan | null {
  if (state.termId !== plan.termId) return null;
  return createPlan(state, { id: plan.id, name: plan.name, savedAt });
}

/** "Plan 1", "Plan 2", …: the first name not taken in the term. */
export function defaultPlanName(plans: readonly Pick<SavedPlan, "name" | "termId">[], termId: string): string {
  const taken = new Set(plans.filter((plan) => plan.termId === termId).map((plan) => plan.name.trim().toLowerCase()));
  let number = 1;
  while (taken.has(`plan ${number}`)) number += 1;
  return `Plan ${number}`;
}

/** The trimmed name, or null when it's empty. Long names are cut to {@link MAX_PLAN_NAME_LENGTH}. */
export function cleanPlanName(name: string): string | null {
  const trimmed = name.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, MAX_PLAN_NAME_LENGTH) : null;
}

export function newPlanId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
