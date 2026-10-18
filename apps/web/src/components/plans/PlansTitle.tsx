"use client";

import { useSelectedPlan } from "./useSelectedPlan";

/** "Sections to register · Plan 1": the page's heading names the plan on screen. */
export function PlansTitle() {
  const { plan } = useSelectedPlan();
  return (
    <>
      Sections to register
      {plan && <span className="font-650 break-words text-ink-muted"> · {plan.name}</span>}
    </>
  );
}
