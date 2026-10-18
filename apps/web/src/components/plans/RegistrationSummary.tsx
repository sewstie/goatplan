"use client";

import { PlanSummary } from "./PlanSummary";
import { SavedPlansInfo } from "./SavedPlansInfo";
import { useSelectedPlan } from "./useSelectedPlan";

/** The panel next to the registration sheet: "Plan ready" (div.app-22.md), or how saved plans work. */
export function RegistrationSummary() {
  const { planId, plan, snapshot } = useSelectedPlan();
  if (!snapshot) return null;
  if (plan) return <PlanSummary plan={plan} />;
  return planId ? null : <SavedPlansInfo />;
}
