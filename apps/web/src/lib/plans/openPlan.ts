import type { StoreApi } from "zustand/vanilla";
import type { Schedule } from "@/lib/engine/types";
import { selectCurrentSchedule, selectSchedules, type PlannerStore } from "@/lib/store";
import type { SavedPlan } from "./types";

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

const BUSY = new Set(["waiting", "solving"]);

/**
 * Resolves once the planner has finished the solve that is waiting or running now. Gives up after
 * `timeoutMs`, so a stuck engine never blocks saving or opening a plan.
 */
export function settled(store: StoreApi<PlannerStore>, timeoutMs = 15_000): Promise<void> {
  if (!BUSY.has(store.getState().solveStatus)) return Promise.resolve();
  return new Promise((resolve) => {
    // A late answer to an older request can briefly report "done" while the next solve still
    // waits, so wait for a solve that starts after this call, or for an empty plan.
    let started = store.getState().solveStatus === "solving";
    const finish = () => {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    const unsubscribe = store.subscribe((state) => {
      if (state.solveStatus === "solving") started = true;
      else if (state.solveStatus === "idle" || state.solveStatus === "error") finish();
      else if (state.solveStatus === "done" && started) finish();
    });
  });
}

function savedSections(plan: SavedPlan): Record<string, string[]> {
  return Object.fromEntries(plan.schedule.map((course) => [course.code, course.sections.map((section) => section.id)]));
}

function matches(schedule: Schedule, saved: Record<string, string[]>): boolean {
  return schedule.courses.every((course) => {
    const wanted = saved[course.code];
    return wanted && course.alternatives.some((option) => sameSet(option, wanted));
  });
}

/** Pages to the schedule with the plan's sections and picks the saved same-time alternatives. */
export function showSavedSchedule(store: StoreApi<PlannerStore>, plan: SavedPlan): boolean {
  const saved = savedSections(plan);
  const index = selectSchedules(store.getState()).findIndex((schedule) => matches(schedule, saved));
  if (index < 0) return false;
  for (let step = store.getState().scheduleIndex; step < index; step += 1) store.getState().nextSchedule();
  const schedule = selectCurrentSchedule(store.getState());
  for (const course of schedule?.courses ?? []) {
    const wanted = saved[course.code];
    if (sameSet(course.sections, wanted)) continue;
    const option = course.alternatives.find((alternative) => sameSet(alternative, wanted));
    if (option) store.getState().chooseAlternative(course.code, option);
  }
  return true;
}

/**
 * Makes the plan the planner's working draft: switches to its term, replaces the courses,
 * preferences, sort and locks, then shows the saved schedule once the engine answers. Courses and
 * sections the term no longer has are left out. Resolves to false if the term couldn't load.
 */
export async function openPlanInPlanner(store: StoreApi<PlannerStore>, plan: SavedPlan): Promise<boolean> {
  if (store.getState().termId !== plan.termId || store.getState().termStatus !== "ready") {
    await store.getState().setTerm(plan.termId);
  }
  const state = store.getState();
  if (state.termId !== plan.termId || state.termStatus !== "ready" || !state.term) return false;

  for (const code of state.courses) store.getState().removeCourse(code);
  for (const code of plan.courses) store.getState().addCourse(code);
  store.getState().setPreferences(structuredClone(plan.preferences));
  store.getState().setSortPreset(plan.sortPreset);
  const sectionIds = new Set(state.term.courses.flatMap((course) => course.sections.map((section) => section.id)));
  for (const [code, ids] of Object.entries(plan.locks)) {
    for (const id of ids) if (sectionIds.has(id)) store.getState().lockSection(code, id);
  }

  await settled(store);
  showSavedSchedule(store, plan);
  return true;
}
