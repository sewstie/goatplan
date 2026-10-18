"use client";

import { useState } from "react";
import { createPlan, defaultPlanName, getPlansSource, newPlanId, settled, termLabel, updatePlan } from "@/lib/plans";
import { getPlannerStore, usePlanner } from "@/lib/store";
import { PlanNameDialog } from "./PlanNameDialog";
import { PlanStatus } from "./PlanStatus";
import { SavedPlansMenu } from "./SavedPlansMenu";
import { SaveScheduleButton } from "./SaveScheduleButton";
import { useOpenPlan } from "./useOpenPlan";
import { usePlanSaveState } from "./usePlanSaveState";

const COULDNT_SAVE = "Couldn’t save. Browser storage is full or blocked.";

/** "Saved plans" and the Save schedule button in the header (div.app-12.md). */
export function PlanActions() {
  const save = usePlanSaveState();
  const term = usePlanner((state) => state.term?.term ?? null);
  const { requestOpen, dialog } = useOpenPlan();
  const [naming, setNaming] = useState<"first" | "copy" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveChanges() {
    const plan = save.currentPlan;
    if (!plan) {
      setNaming("first");
      return;
    }
    setSaving(true);
    setError(null);
    const store = getPlannerStore();
    await settled(store);
    const updated = updatePlan(plan, store.getState(), new Date());
    setSaving(false);
    if (updated && !getPlansSource().save(updated)) setError(COULDNT_SAVE);
  }

  async function saveAsNew(name: string): Promise<string | null> {
    const store = getPlannerStore();
    await settled(store);
    const plan = createPlan(store.getState(), { id: newPlanId(), name, savedAt: new Date() });
    if (!plan) return "There’s no schedule to save right now.";
    const source = getPlansSource();
    if (!source.save(plan)) return COULDNT_SAVE;
    source.setCurrent(plan.termId, plan.id);
    setError(null);
    setNaming(null);
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-10">
        <PlanStatus status={save.status} error={error} />
        <SavedPlansMenu
          plans={save.termPlans}
          termName={term ? termLabel(term) : null}
          currentPlan={save.currentPlan}
          disabled={save.busy}
          canSaveAsNew={save.canSave || save.status === "saved"}
          onOpenPlan={(plan) => requestOpen(plan, "/")}
          onSaveAsNew={() => setNaming("copy")}
        />
      </div>
      <SaveScheduleButton
        saved={save.status === "saved"}
        disabled={!save.canSave || save.busy || saving}
        onSave={saveChanges}
      />
      <PlanNameDialog
        open={naming !== null}
        title={naming === "copy" ? "Save as a new plan" : "Save schedule"}
        description="Saved plans stay in this browser."
        confirmLabel="Save"
        initialName={defaultPlanName(save.allPlans ?? [], save.termId ?? "")}
        onSubmit={saveAsNew}
        onClose={() => setNaming(null)}
      />
      {dialog}
    </>
  );
}
