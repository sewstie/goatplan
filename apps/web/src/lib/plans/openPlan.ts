import type { StoreApi } from "zustand/vanilla";
import type { PlannerStore } from "@/lib/store";
import type { SavedPlan } from "./types";

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

/**
 * Makes the plan the planner's working draft: switches to its term, replaces the courses,
 * preferences, sort and locks, solves once and shows the saved schedule. Courses and sections the
 * term no longer has are left out. Resolves to false if the term couldn't load.
 */
export function openPlanInPlanner(store: StoreApi<PlannerStore>, plan: SavedPlan): Promise<boolean> {
  const { courses, preferences, locks, professorByCourse, sortPreset } = plan;
  const chosen = Object.fromEntries(plan.schedule.map((course) => [course.code, course.sections.map((section) => section.id)]));
  return store.getState().openPlan(plan.termId, { courses, preferences, locks, professorByCourse, sortPreset }, chosen);
}
