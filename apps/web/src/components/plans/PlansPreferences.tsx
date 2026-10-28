"use client";

import { ReadOnlyPreferences } from "@/components/preferences/ReadOnlyPreferences";
import { useSelectedPlan } from "./useSelectedPlan";

/**
 * The preferences row on the Sections-to-register page. A saved plan's preferences and sort are a
 * record of the choices behind it, not controls to change here, so they always render read-only.
 * When no plan is selected (the list of plans) the row collapses to a spacer.
 */
export function PlansPreferences() {
  const { plan: selectedPlan } = useSelectedPlan();
  if (!selectedPlan) return <div aria-hidden="true" className="min-h-35.5 shrink-0" />;
  return <ReadOnlyPreferences plan={selectedPlan} />;
}
