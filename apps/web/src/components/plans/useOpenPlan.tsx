"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { getPlansSource, openPlanInPlanner, wouldDiscardWork, type SavedPlan, type WorkingPlan } from "@/lib/plans";
import { getPlannerStore, selectChosenSections, selectCurrentSchedule, storedDraft } from "@/lib/store";
import { OpenPlanDialog } from "./OpenPlanDialog";

/** The draft a plan of this term would replace: the live one, or the one stored for another term. */
function workingDraft(termId: string): WorkingPlan | null {
  const state = getPlannerStore().getState();
  if (state.termId === termId && state.termStatus === "ready") {
    const hasSchedule = selectCurrentSchedule(state) !== null;
    return {
      courses: state.courses,
      locks: state.locks,
      professorByCourse: state.professorByCourse,
      preferences: state.preferences,
      chosen: hasSchedule ? selectChosenSections(state) : null,
    };
  }
  const draft = storedDraft(termId);
  return draft && { ...draft, chosen: null };
}

/**
 * Opens a saved plan in the planner and goes to `destination`, asking first when that would
 * discard unsaved changes. Render `dialog` once in the component that uses it.
 */
export function useOpenPlan(): { requestOpen: (plan: SavedPlan, destination?: string) => void; dialog: ReactNode } {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<{ plan: SavedPlan; destination?: string } | null>(null);

  function go(plan: SavedPlan, destination?: string) {
    if (destination && destination !== pathname) router.push(destination);
    const source = getPlansSource();
    const snapshot = source.getSnapshot();
    const state = getPlannerStore().getState();
    const alreadyOpen =
      snapshot.current[plan.termId] === plan.id &&
      state.termId === plan.termId &&
      state.termStatus === "ready" &&
      !wouldDiscardWork(plan, workingDraft(plan.termId));
    if (alreadyOpen) {
      state.showFound();
      return;
    }
    source.setCurrent(plan.termId, plan.id);
    void openPlanInPlanner(getPlannerStore(), plan);
  }

  function requestOpen(plan: SavedPlan, destination?: string) {
    const snapshot = getPlansSource().getSnapshot();
    const currentPlan = snapshot.plans.find((item) => item.id === snapshot.current[plan.termId]) ?? null;
    if (wouldDiscardWork(currentPlan, workingDraft(plan.termId))) setPending({ plan, destination });
    else go(plan, destination);
  }

  const dialog = (
    <OpenPlanDialog
      plan={pending?.plan ?? null}
      onClose={() => setPending(null)}
      onConfirm={() => {
        if (pending) go(pending.plan, pending.destination);
        setPending(null);
      }}
    />
  );

  return { requestOpen, dialog };
}
