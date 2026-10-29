"use client";

import { usePlanner } from "@/lib/store";
import { PositionText } from "./PositionText";
import { StepperBox } from "./StepperBox";

export function SavedPlanSwitcher({ wide = false }: { wide?: boolean }) {
  const plans = usePlanner((state) => state.savedPlans);
  const termId = usePlanner((state) => state.termId);
  const id = usePlanner((state) => state.savedPlanId);
  const previous = usePlanner((state) => state.previousSavedPlan);
  const next = usePlanner((state) => state.nextSavedPlan);
  const termPlans = plans.filter((plan) => plan.termId === termId);
  const index = termPlans.findIndex((plan) => plan.id === id);
  const plan = termPlans[index];
  if (!plan) return null;
  const label = `Saved plan ${index + 1} of ${termPlans.length} · ${plan.name}`;
  const atStart = index === 0;
  const atEnd = index === termPlans.length - 1;
  const size = wide ? "wide" : "default";
  return (
    <StepperBox
      label="Saved plans"
      size={size}
      previous={{ label: "Previous saved plan", disabled: atStart, onClick: previous }}
      next={{ label: "Next saved plan", disabled: atEnd, onClick: next }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (event.key === "ArrowLeft") previous();
          else next();
        }
      }}
    >
      <PositionText
        role="status"
        aria-label={label}
        title={plan.name}
        noun="Saved plan"
        index={index + 1}
        total={termPlans.length}
        after={` · ${plan.name}`}
        size={size}
        className={wide ? undefined : "max-w-260"}
      />
    </StepperBox>
  );
}
