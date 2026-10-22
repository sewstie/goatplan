import type { SavedCourse } from "@/lib/plans/types";
import { selectChosenSections, selectCurrentSchedule } from "./selectors";
import type { PlannerState } from "./types";

export function selectSavedPlan(state: PlannerState) {
  return state.savedPlans.find((plan) => plan.id === state.savedPlanId && plan.termId === state.termId) ?? null;
}

export function selectTermSavedPlans(state: PlannerState) {
  return state.savedPlans.filter((plan) => plan.termId === state.termId);
}

const viewedSchedules = new WeakMap<PlannerState, SavedCourse[] | null>();

export function selectViewedSchedule(state: PlannerState): SavedCourse[] | null {
  const saved = selectSavedPlan(state);
  if (saved) return saved.schedule;
  if (!state.term || !selectCurrentSchedule(state)) return null;
  if (viewedSchedules.has(state)) return viewedSchedules.get(state)!;
  const chosen = selectChosenSections(state);
  const schedule = state.courses.flatMap((code) => {
    const course = state.term!.courses.find((item) => item.code === code);
    return course && chosen[code] ? [{ code, title: course.title, sections: chosen[code].flatMap((id) => course.sections.find((section) => section.id === id) ?? []) }] : [];
  });
  viewedSchedules.set(state, schedule);
  return schedule;
}

export function selectViewedCourse(state: PlannerState) {
  return state.savedPlanId ? state.savedSelectedCourse : state.selectedCourse;
}

export function selectViewedSection(state: PlannerState) {
  return state.savedPlanId ? state.savedSelectedSection : state.selectedSection;
}
