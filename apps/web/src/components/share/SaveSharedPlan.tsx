"use client";

import { useState } from "react";
import { CopySimple, X } from "@phosphor-icons/react/ssr";
import { COULDNT_SAVE } from "@/components/plans/PlanActions";
import { useOpenPlan } from "@/components/plans/useOpenPlan";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/track";
import { getPlansSource, newPlanId, type SavedPlan } from "@/lib/plans";
import { closeSharedView } from "@/lib/share/closeSharedView";
import { canSaveCopy, savedCopy } from "@/lib/share/savedCopy";
import { usePlanner, usePlannerStore } from "@/lib/store";
import { CopySavedDialog } from "./CopySavedDialog";

/** Close preview, Save a copy and Open for editing. The viewer's draft stays as it is until they open a copy. */
export function SaveSharedPlan({ view }: { view: SavedPlan | undefined }) {
  const store = usePlannerStore();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const saved = usePlanner((state) => state.savedPlans.find((plan) => plan.id === savedId) ?? null);
  const { requestOpen, dialog } = useOpenPlan();
  const canSave = Boolean(view && canSaveCopy(view));

  function save(): SavedPlan | null {
    if (saved) return saved;
    const source = getPlansSource();
    const copy = view && savedCopy(view, source.getSnapshot().plans, { id: newPlanId(), savedAt: new Date() });
    if (!copy) return null;
    const stored = source.save(copy);
    setFailed(!stored);
    if (!stored) return null;
    track("plan_saved", { term: copy.termId });
    setSavedId(copy.id);
    return copy;
  }

  const close = () => closeSharedView(() => store.getState().showFound());

  return (
    <>
      <Button variant="secondary" className="max-tablet:min-h-44" icon={<X aria-hidden />} onClick={close}>Close preview</Button>
      <Button
        variant="secondary"
        className="max-tablet:min-h-44"
        icon={<CopySimple aria-hidden />}
        disabled={!canSave}
        onClick={() => {
          if (save()) setShowSaved(true);
        }}
      >
        Save a copy
      </Button>
      <Button
        className="max-tablet:min-h-44"
        disabled={!canSave}
        onClick={() => {
          const copy = save();
          if (copy) requestOpen(copy, "/");
        }}
      >
        Open for editing
      </Button>
      {failed && <p role="alert" className="basis-full text-right text-8 leading-12 text-warning tablet:absolute tablet:top-full tablet:right-20 tablet:z-30 tablet:mt-4 tablet:rounded-row tablet:border tablet:border-line-popover tablet:bg-surface tablet:px-8 tablet:py-4 tablet:shadow-popover">{COULDNT_SAVE}</p>}
      {saved && showSaved && (
        <CopySavedDialog
          plan={saved}
          onClose={() => setShowSaved(false)}
          onBackToDraft={() => {
            setShowSaved(false);
            close();
          }}
          onEdit={() => {
            setShowSaved(false);
            requestOpen(saved, "/");
          }}
        />
      )}
      {dialog}
    </>
  );
}
