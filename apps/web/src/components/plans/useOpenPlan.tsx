"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { getPlansSource, openPlanInPlanner, wouldDiscardWork, type SavedPlan, type WorkingPlan } from "@/lib/plans";
import { selectChosenSections, selectCurrentSchedule, storedDraft, usePlannerStore, type PlannerState } from "@/lib/store";
import { emptyDraft } from "@/lib/store/draft";
import { OpenPlanDialog } from "./OpenPlanDialog";
import { NewPlanDialog } from "./NewPlanDialog";

type PlanRequest = { plan: SavedPlan; destination?: string } | { termId: string };

/** The draft a plan of this term would replace: the live one, or the one stored for another term. */
function workingDraft(termId: string, state: PlannerState): WorkingPlan | null {
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

export function useOpenPlan(onOpened?: (plan: SavedPlan | null) => void): { requestOpen: (plan: SavedPlan, destination?: string) => void; requestNewPlan: () => void; dialog: ReactNode } {
  const store = usePlannerStore();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<PlanRequest | null>(null);

  async function go(request: PlanRequest) {
    const source = getPlansSource();
    const state = store.getState();
    if (!("plan" in request)) {
      if (await state.openPlan(request.termId, emptyDraft())) {
        source.setCurrent(request.termId, null);
        onOpened?.(null);
      }
      return;
    }
    const { plan, destination } = request;
    if (destination && destination !== pathname) router.push(destination);
    const snapshot = source.getSnapshot();
    const alreadyOpen =
      snapshot.current[plan.termId] === plan.id &&
      state.termId === plan.termId &&
      state.termStatus === "ready" &&
      !wouldDiscardWork(plan, workingDraft(plan.termId, state));
    if (alreadyOpen) {
      state.showFound();
      onOpened?.(plan);
      return;
    }
    source.setCurrent(plan.termId, plan.id);
    if (await openPlanInPlanner(store, plan)) onOpened?.(plan);
  }

  function request(request: PlanRequest) {
    const termId = "plan" in request ? request.plan.termId : request.termId;
    const snapshot = getPlansSource().getSnapshot();
    const currentPlan = snapshot.plans.find((item) => item.id === snapshot.current[termId]) ?? null;
    if (wouldDiscardWork(currentPlan, workingDraft(termId, store.getState()))) setPending(request);
    else void go(request);
  }

  function requestOpen(plan: SavedPlan, destination?: string) {
    request({ plan, destination });
  }

  function requestNewPlan() {
    const state = store.getState();
    if (state.termStatus === "ready" && state.termId) request({ termId: state.termId });
  }

  function confirm() {
    if (pending) void go(pending);
    setPending(null);
  }

  const dialog = (
    <>
      <OpenPlanDialog plan={pending && "plan" in pending ? pending.plan : null} onClose={() => setPending(null)} onConfirm={confirm} />
      <NewPlanDialog open={pending !== null && !("plan" in pending)} onClose={() => setPending(null)} onConfirm={confirm} />
    </>
  );

  return { requestOpen, requestNewPlan, dialog };
}
