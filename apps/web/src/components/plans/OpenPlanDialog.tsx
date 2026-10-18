"use client";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { SavedPlan } from "@/lib/plans";

type OpenPlanDialogProps = {
  plan: SavedPlan | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** Asks before a plan replaces a working draft with unsaved changes. */
export function OpenPlanDialog({ plan, onConfirm, onClose }: OpenPlanDialogProps) {
  return (
    <Dialog
      open={plan !== null}
      onClose={onClose}
      title={plan ? `Open “${plan.name}”?` : ""}
      description={plan ? `Your unsaved changes to the ${plan.term.name} schedule will be lost.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Open plan</Button>
        </>
      }
    />
  );
}
