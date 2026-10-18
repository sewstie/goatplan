"use client";

import { PlanActions } from "./PlanActions";
import { useSelectedPlan } from "./useSelectedPlan";

/** The header actions on /plans, describing the plan on screen. Needs a Suspense boundary above it. */
export function PlansPageActions() {
  const { plan } = useSelectedPlan();
  return <PlanActions shownPlan={plan} />;
}
