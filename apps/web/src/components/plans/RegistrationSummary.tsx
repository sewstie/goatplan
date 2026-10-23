"use client";

import { PlanSummary } from "./PlanSummary";
import { useSelectedPlan } from "./useSelectedPlan";

export function RegistrationSummary() {
  const { plan } = useSelectedPlan();
  return plan ? <PlanSummary plan={plan} /> : null;
}
