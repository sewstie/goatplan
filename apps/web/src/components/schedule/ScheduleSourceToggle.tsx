"use client";

import { cx } from "@/components/ui/cx";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePlanner } from "@/lib/store";

export function ScheduleSourceToggle() {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const showFound = usePlanner((state) => state.showFound);
  const showSaved = usePlanner((state) => state.showSaved);
  const empty = usePlanner((state) => !state.savedPlans.some((plan) => plan.termId === state.termId));
  const pill = "rounded-row border border-accent-line px-10 py-5.5 text-12 leading-17-4 font-650";
  const savedButton = <button type="button" aria-pressed={saved} aria-disabled={empty} onClick={() => { if (!empty) showSaved(); }} className={cx(pill, "aria-disabled:cursor-not-allowed aria-disabled:opacity-45", saved ? "bg-accent-soft text-accent" : "bg-surface text-ink-muted")}>Saved</button>;
  return (
    <div role="group" aria-label="Schedule source" className="flex items-center gap-5">
      <button type="button" aria-pressed={!saved} onClick={showFound} className={cx(pill, !saved ? "bg-accent-soft text-accent" : "bg-surface text-ink-muted")}>Found</button>
      {empty ? <Tooltip content="No saved plans for this term yet">{savedButton}</Tooltip> : savedButton}
      <span role="status" aria-live="polite" className="sr-only">{saved ? "Showing saved plans" : "Showing found schedules"}</span>
    </div>
  );
}
