"use client";

import { useShallow } from "zustand/react/shallow";
import { getSaveState, type SaveState, type SavedPlan } from "@/lib/plans";
import { usePlans } from "@/lib/plans/usePlans";
import { selectChosenSections, selectCurrentSchedule, usePlanner } from "@/lib/store";

export interface PlanSaveState extends SaveState {
  termId: string | null;
  /** This term's saved plans, or null before they're read. */
  termPlans: SavedPlan[] | null;
  allPlans: SavedPlan[] | null;
}

/** Whether the working plan is saved, for the header's status, Save button and Saved plans menu. */
export function usePlanSaveState(): PlanSaveState {
  const termId = usePlanner((state) => state.termId);
  const termStatus = usePlanner((state) => state.termStatus);
  const courses = usePlanner((state) => state.courses);
  const locks = usePlanner((state) => state.locks);
  const professorByCourse = usePlanner((state) => state.professorByCourse);
  const preferences = usePlanner((state) => state.preferences);
  const hasSchedule = usePlanner((state) => state.solveStatus !== "error" && selectCurrentSchedule(state) !== null);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const snapshot = usePlans();

  const allPlans = snapshot?.plans ?? null;
  const termPlans = allPlans && termId ? allPlans.filter((plan) => plan.termId === termId) : null;
  const currentId = termId ? snapshot?.current[termId] : undefined;
  const currentPlan = termPlans?.find((plan) => plan.id === currentId) ?? null;
  const state = getSaveState({
    termStatus,
    hasSchedule,
    currentPlan,
    working: { courses, locks, professorByCourse, preferences, chosen: hasSchedule ? chosen : null },
  });
  return { ...state, termId, termPlans, allPlans };
}
