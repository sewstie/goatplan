"use client";

import { usePlanner } from "@/lib/store";
import { useSelectedPlan } from "./useSelectedPlan";

export function useReadOnlyPlan() {
  const { plan, snapshot } = useSelectedPlan();
  const termId = usePlanner((state) => state.termId);
  return plan && (plan.termId !== termId || snapshot?.current[plan.termId] !== plan.id) ? plan : null;
}
