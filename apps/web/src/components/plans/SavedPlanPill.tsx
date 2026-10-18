"use client";

import { useSelectedPlan } from "./useSelectedPlan";

/** A saved plan is one schedule, so its page shows the single "Schedule 1 of 1" pill (div.app-22). */
export function SavedPlanPill() {
  const { plan } = useSelectedPlan();
  if (!plan) return null;
  return (
    <span className="rounded-row border border-accent-line bg-surface px-10 py-5.5 text-12 leading-17-4 font-650 text-accent">
      Schedule 1 of 1
    </span>
  );
}
