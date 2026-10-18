"use client";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { SavedPlan } from "@/lib/plans";

type DeletePlanDialogProps = {
  plan: SavedPlan | null;
  onConfirm: (plan: SavedPlan) => void;
  onClose: () => void;
};

export function DeletePlanDialog({ plan, onConfirm, onClose }: DeletePlanDialogProps) {
  return (
    <Dialog
      open={plan !== null}
      onClose={onClose}
      title={plan ? `Delete “${plan.name}”?` : ""}
      description="It will be removed from this browser. This can’t be undone."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="warning" onClick={() => plan && onConfirm(plan)}>
            Delete plan
          </Button>
        </>
      }
    />
  );
}
