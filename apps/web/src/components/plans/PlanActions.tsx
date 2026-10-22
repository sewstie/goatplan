"use client";

import { useState } from "react";
import {
  createPlan,
  defaultPlanName,
  getPlansSource,
  newPlanId,
  settled,
  termLabel,
  updatePlan,
} from "@/lib/plans";
import { getPlannerStore, selectSavedPlan, usePlanner } from "@/lib/store";
import { PlanNameDialog } from "./PlanNameDialog";
import { SavedPlansMenu } from "./SavedPlansMenu";
import { SaveScheduleButton } from "./SaveScheduleButton";
import { useOpenPlan } from "./useOpenPlan";
import { usePlanSaveState } from "./usePlanSaveState";

const COULDNT_SAVE = "Couldn’t save. Browser storage is full or blocked.";

/** "Saved plans" and the Save schedule button in the header (div.app-12.md). */
export function PlanActions() {
  const viewed = usePlanner(selectSavedPlan);
  const save = usePlanSaveState();
  const status = viewed ? "saved" : save.status;
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
    if (!viewed) await settled(store);
    const details = { id: newPlanId(), name, savedAt: new Date() };
    const plan = viewed
      ? { ...structuredClone(viewed), ...details, savedAt: details.savedAt.toISOString() }
      : createPlan(store.getState(), details);
    if (!plan) return "There’s no schedule to save right now.";
    const source = getPlansSource();
    if (!source.save(plan)) return COULDNT_SAVE;
    if (viewed) store.getState().showSaved(plan.id);
    else source.setCurrent(plan.termId, plan.id);
    setError(null);
    setNaming(null);
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-10">
        <SavedPlansMenu
          plans={save.termPlans}
          termName={term ? termLabel(term) : null}
          currentPlan={viewed ?? save.currentPlan}
          disabled={!viewed && save.busy}
          canSaveAsNew={viewed !== null || save.canSave || save.status === "saved"}
          onOpenPlan={(plan) => requestOpen(plan, "/")}
          onSaveAsNew={() => setNaming("copy")}
        />
      </div>
      <SaveScheduleButton
        saved={status === "saved"}
        disabled={!save.canSave || save.busy || saving}
        onSave={saveChanges}
      />
      {error && <p role="alert" className="text-9 leading-13 text-warning">{error}</p>}
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
