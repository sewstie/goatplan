"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/IconButton";
import { usePlanner } from "@/lib/store";

// Ticket 11: min-w-44 min-h-44 ensures 44px touch targets on phone.
const ARROW_TOUCH = "min-w-44 min-h-44";

export function SavedPlanSwitcher() {
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
  const disabled = "aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:hover:bg-surface";
  return (
    <div role="group" aria-label="Saved plans" className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-4" onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        if (event.key === "ArrowLeft") previous();
        else next();
      }
    }}>
      <IconButton label="Previous saved plan" icon={<CaretLeft aria-hidden />} aria-disabled={atStart} className={`${ARROW_TOUCH} ${disabled}`} onClick={() => { if (!atStart) previous(); }} />
      <p role="status" aria-live="polite" aria-atomic="true" aria-label={label} title={plan.name} className="max-w-260 truncate rounded-row border border-accent-line bg-surface px-10 py-5.5 text-12 leading-17-4 font-650 text-accent">{label}</p>
      <IconButton label="Next saved plan" icon={<CaretRight aria-hidden />} aria-disabled={atEnd} className={`${ARROW_TOUCH} ${disabled}`} onClick={() => { if (!atEnd) next(); }} />
    </div>
  );
}
