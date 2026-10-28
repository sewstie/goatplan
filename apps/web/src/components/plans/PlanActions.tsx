"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  createPlan,
  defaultPlanName,
  getPlansSource,
  newPlanId,
  settled,
  termLabel,
  updatePlan,
} from "@/lib/plans";
import { selectSavedPlan, usePlanner, usePlannerStore } from "@/lib/store";
import { PlanNameDialog } from "./PlanNameDialog";
import { SavedPlansMenu } from "./SavedPlansMenu";
import { SaveScheduleButton } from "./SaveScheduleButton";
import { useOpenPlan } from "./useOpenPlan";
import { usePlanSaveState } from "./usePlanSaveState";

const COULDNT_SAVE = "Couldn’t save. Browser storage is full or blocked.";

type PlanActionsLayout = (parts: { menu: ReactNode; save: ReactNode }) => ReactNode;

const besideEachOther: PlanActionsLayout = ({ menu, save }) => (
  <>
    <div className="flex items-center gap-10">{menu}</div>
    {save}
  </>
);

/**
 * "Saved plans" and the Save schedule button in the header (div.app-12.md). The phone header puts the
 * two in different rows, so it passes its own `layout`.
 */
export function PlanActions({ layout = besideEachOther }: { layout?: PlanActionsLayout } = {}) {
  const store = usePlannerStore();
  const viewed = usePlanner(selectSavedPlan);
  const save = usePlanSaveState();
  const term = usePlanner((state) => state.term?.term ?? null);
  const [opened, setOpened] = useState<{ name: string | null; sequence: number } | null>(null);
  const { requestOpen, requestNewPlan, dialog } = useOpenPlan((plan) => setOpened((previous) => ({ name: plan?.name ?? null, sequence: (previous?.sequence ?? 0) + 1 })));
  const [naming, setNaming] = useState<"first" | "copy" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) document.getElementById(opened.name === null ? "tutorial-search" : "tutorial-schedules")?.focus();
  }, [opened]);

  async function saveChanges() {
    const plan = save.currentPlan;
    if (!plan) {
      setNaming("first");
      return;
    }
    setSaving(true);
    setError(null);
    await settled(store);
    const updated = updatePlan(plan, store.getState(), new Date());
    setSaving(false);
    if (updated && !getPlansSource().save(updated)) setError(COULDNT_SAVE);
  }

  async function saveAsNew(name: string): Promise<string | null> {
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
      {layout({
        menu: (
          <SavedPlansMenu
            plans={save.termPlans}
            termName={term ? termLabel(term) : null}
            currentPlan={viewed ?? save.currentPlan}
            disabled={!viewed && save.busy}
            canSaveAsNew={viewed !== null || save.canSave || save.status === "saved"}
            onOpenPlan={(plan) => requestOpen(plan, "/")}
            onSaveAsNew={() => setNaming("copy")}
            onNewPlan={requestNewPlan}
          />
        ),
        save: (
          <SaveScheduleButton
            saved={viewed !== null || save.status === "saved"}
            unsaved={viewed === null && save.status === "unsaved"}
            disabled={viewed !== null || !save.canSave || save.busy || saving}
            onSave={saveChanges}
          />
        ),
      })}
      {error && <p role="alert" className="text-9 leading-13 text-warning">{error}</p>}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {opened && <span key={opened.sequence}>{opened.name === null ? "Started a new plan." : `Opened “${opened.name}” for editing.`}</span>}
      </span>
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
