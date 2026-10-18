"use client";

import { useEffect, useRef, useState } from "react";
import { getPlansSource, groupPlansByTerm, type PlansSnapshot, type SavedPlan } from "@/lib/plans";
import { usePlanner } from "@/lib/store";
import { DeletePlanDialog } from "./DeletePlanDialog";
import { NoSavedPlans } from "./NoSavedPlans";
import { PlanNameDialog } from "./PlanNameDialog";
import { TermPlanGroup } from "./TermPlanGroup";
import { useOpenPlan } from "./useOpenPlan";

/** The saved plans in this browser: open, rename, delete, or see the sections to register. */
export function SavedPlansList({ snapshot }: { snapshot: PlansSnapshot }) {
  const termStatus = usePlanner((state) => state.termStatus);
  const { requestOpen, dialog } = useOpenPlan();
  const [renaming, setRenaming] = useState<SavedPlan | null>(null);
  const [deleting, setDeleting] = useState<SavedPlan | null>(null);
  const [deleted, setDeleted] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The deleted plan's row (where focus came from) is gone, so focus goes to the list's heading.
  // This runs after the dialog's own effect, which tries to give focus back to that row.
  useEffect(() => {
    if (deleted > 0) headingRef.current?.focus();
  }, [deleted]);

  if (snapshot.plans.length === 0) return <NoSavedPlans headingRef={headingRef} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-20 overflow-y-auto px-20 py-23">
      <div className="flex flex-col gap-5">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-19 leading-27-55 font-700 tracking-heading-sm text-ink outline-none"
        >
          Your saved plans
        </h2>
        <p className="text-10 leading-14-5 text-ink-muted">
          Saved in this browser. Seats and times are checked against the latest course data.
        </p>
      </div>
      {groupPlansByTerm(snapshot.plans).map((plans) => (
        <TermPlanGroup
          key={plans[0].termId}
          plans={plans}
          openPlanId={snapshot.current[plans[0].termId]}
          openDisabled={termStatus === "idle" || termStatus === "loading"}
          onOpen={(plan) => requestOpen(plan, "/")}
          onRename={setRenaming}
          onDelete={setDeleting}
        />
      ))}
      <PlanNameDialog
        open={renaming !== null}
        title="Rename plan"
        confirmLabel="Rename"
        initialName={renaming?.name ?? ""}
        onSubmit={(name) => {
          if (renaming && !getPlansSource().rename(renaming.id, name)) {
            return "Couldn’t rename. Browser storage is full or blocked.";
          }
          setRenaming(null);
          return null;
        }}
        onClose={() => setRenaming(null)}
      />
      <DeletePlanDialog
        plan={deleting}
        onConfirm={(plan) => {
          getPlansSource().remove(plan.id);
          setDeleting(null);
          setDeleted((count) => count + 1);
        }}
        onClose={() => setDeleting(null)}
      />
      {dialog}
    </div>
  );
}
