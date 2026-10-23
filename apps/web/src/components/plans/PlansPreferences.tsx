"use client";

import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { ReadOnlyPreferences } from "@/components/preferences/ReadOnlyPreferences";
import { useReadOnlyPlan } from "./useReadOnlyPlan";
import { useSelectedPlan } from "./useSelectedPlan";

export function PlansPreferences() {
  const { plan: selectedPlan } = useSelectedPlan();
  const plan = useReadOnlyPlan();
  if (!selectedPlan) return <div aria-hidden="true" className="min-h-35.5 shrink-0" />;
  return plan ? <ReadOnlyPreferences plan={plan} /> : <PreferencesBar />;
}
