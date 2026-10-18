"use client";

import { useId } from "react";
import { termLabel, type SavedPlan } from "@/lib/plans";
import { useTermFile } from "@/lib/plans/useTermFile";
import { SavedPlanRow } from "./SavedPlanRow";

type TermPlanGroupProps = {
  plans: SavedPlan[];
  openPlanId: string | undefined;
  openDisabled: boolean;
  onOpen: (plan: SavedPlan) => void;
  onRename: (plan: SavedPlan) => void;
  onDelete: (plan: SavedPlan) => void;
};

/** One term's saved plans, checked against that term's latest data. */
export function TermPlanGroup({ plans, openPlanId, openDisabled, onOpen, onRename, onDelete }: TermPlanGroupProps) {
  const headingId = useId();
  const data = useTermFile(plans[0].termId);
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <h3 id={headingId} className="text-10 leading-14-5 font-650 text-ink">
        {termLabel(plans[0].term)}
      </h3>
      <ul className="flex flex-col gap-8">
        {plans.map((plan) => (
          <SavedPlanRow
            key={plan.id}
            plan={plan}
            data={data}
            isOpen={plan.id === openPlanId}
            disabled={openDisabled}
            onOpen={() => onOpen(plan)}
            onRename={() => onRename(plan)}
            onDelete={() => onDelete(plan)}
          />
        ))}
      </ul>
    </section>
  );
}
