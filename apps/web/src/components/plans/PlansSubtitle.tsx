"use client";

import { countLabel, sectionCount } from "@/lib/plans";
import { useSelectedPlan } from "./useSelectedPlan";

/** "3 courses · 4 sections · Saved plan", or how many plans the list holds. */
export function PlansSubtitle() {
  const { planId, plan, snapshot } = useSelectedPlan();
  if (!snapshot) return null;
  if (plan) {
    return (
      <>
        {countLabel(plan.schedule.length, "course")} · {countLabel(sectionCount(plan), "section")} · Saved plan
      </>
    );
  }
  if (planId) return null;
  const count = snapshot.plans.length;
  return <>{count === 0 ? "No saved plans yet" : `${countLabel(count, "saved plan")} · Pick one to see its sections`}</>;
}
