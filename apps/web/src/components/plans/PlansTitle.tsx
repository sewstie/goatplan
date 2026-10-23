"use client";

import { useSelectedPlan } from "./useSelectedPlan";

export function PlansTitle() {
  const { plan, planId } = useSelectedPlan();
  if (!planId) return <>All saved plans</>;
  return (
    <>
      Sections to register
      {plan && <span className="font-650 break-words text-ink-muted"> · {plan.name}</span>}
    </>
  );
}
