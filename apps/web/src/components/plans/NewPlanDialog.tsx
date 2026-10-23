"use client";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export function NewPlanDialog({ open, onConfirm, onClose }: { open: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      title="Start a new plan?"
      description="Your unsaved changes to this schedule will be lost. Your saved plans will stay in this browser."
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm}>Start a new plan</Button>
      </>}
    />
  );
}
