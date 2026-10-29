"use client";

import { PositionText } from "@/components/schedule/PositionText";
import { StepperBox } from "@/components/schedule/StepperBox";
import { useSelectedPlan } from "./useSelectedPlan";

/** A saved plan is one schedule, so its page shows the single "Schedule 1 of 1" pill (div.app-22). */
export function SavedPlanPill() {
  const { plan } = useSelectedPlan();
  if (!plan) return null;
  return (
    <StepperBox>
      <PositionText noun="Schedule" index={1} total={1} aria-live={undefined} aria-atomic={undefined} />
    </StepperBox>
  );
}
