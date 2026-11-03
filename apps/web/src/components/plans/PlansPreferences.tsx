"use client";

import { ReadOnlyPreferences } from "@/components/preferences/ReadOnlyPreferences";
import { useSelectedPlan } from "./useSelectedPlan";

/**
 * The preferences row on the Sections-to-register page. A saved plan's preferences and sort are a
 * record of the choices behind it, not controls to change here, so they always render read-only.
 * The list of plans has no row.
 */
export function PlansPreferences() {
  const { plan: selectedPlan } = useSelectedPlan();
  if (!selectedPlan) return null;
  return <ReadOnlyPreferences plan={selectedPlan} />;
}
