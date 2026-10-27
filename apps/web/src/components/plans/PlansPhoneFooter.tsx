"use client";

import { DataUpdated } from "@/components/shell/DataUpdated";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { useSelectedPlan } from "./useSelectedPlan";

/** Shows DataUpdated at the bottom of the plans page on phones only. */
export function PlansPhoneFooter() {
  const phone = usePhoneViewport();
  const { plan } = useSelectedPlan();
  if (!phone) return null;
  return <DataUpdated termId={plan?.termId} />;
}
