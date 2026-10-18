"use client";

import { PlanNotFound } from "./PlanNotFound";
import { RegistrationSheetView } from "./RegistrationSheetView";
import { SavedPlansList } from "./SavedPlansList";
import { useSelectedPlan } from "./useSelectedPlan";

/** The main panel of /plans: one plan's "Ready for Workday" sheet (div.app-22.md), or the list of plans. */
export function RegistrationSheet() {
  const { planId, plan, snapshot } = useSelectedPlan();
  if (!snapshot) return null;
  if (plan) return <RegistrationSheetView plan={plan} />;
  if (planId) return <PlanNotFound />;
  return <SavedPlansList snapshot={snapshot} />;
}
