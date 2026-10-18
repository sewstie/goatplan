"use client";

import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { ReadOnlyPreferences } from "@/components/preferences/ReadOnlyPreferences";
import { useReadOnlyPlan } from "./useReadOnlyPlan";

export function PlansPreferences() {
  const plan = useReadOnlyPlan();
  return plan ? <ReadOnlyPreferences plan={plan} /> : <PreferencesBar />;
}
